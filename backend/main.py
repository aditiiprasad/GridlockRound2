from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from collections import Counter, defaultdict
from typing import Optional
import requests
import os
from dotenv import load_dotenv

from fuzzy_engine import compute_resources
from data_pipeline import load_full_data

load_dotenv()
MAPPLS_ACCESS_TOKEN = os.getenv("MAPPLS_ACCESS_TOKEN")

app = FastAPI(title="Traffic Intelligence Engine API — ASTraM")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load ML model ────────────────────────────────────────────────────────────
MODEL_PATH = "model.joblib"
try:
    model_pipeline = joblib.load(MODEL_PATH)
    print("Model loaded OK")
except FileNotFoundError:
    model_pipeline = None
    print(f"Warning: Model not found at {MODEL_PATH}")

# ── Pre-load analytics data once at startup ──────────────────────────────────
print("Loading analytics dataset...")
_df = load_full_data()
print(f"Analytics dataset: {len(_df)} rows loaded")

# ── Historical lookup helpers ────────────────────────────────────────────────
_CAUSE_CLOSURE_RATE: dict[str, float] = {}
_CAUSE_AVG_DURATION: dict[str, float] = {}
_JUNCTION_COUNTS: dict[str, int] = {}
_CORRIDOR_HOUR_PROFILE: dict[str, list[int]] = {}

def _precompute():
    global _CAUSE_CLOSURE_RATE, _CAUSE_AVG_DURATION, _JUNCTION_COUNTS, _CORRIDOR_HOUR_PROFILE
    df = _df.copy()

    # Closure rate per event cause
    for cause, grp in df.groupby('event_cause'):
        _CAUSE_CLOSURE_RATE[cause] = round(grp['requires_road_closure'].mean() * 100, 1)

    # Avg duration per event cause (only rows with valid duration)
    dur_df = df[df['resolution_time_minutes'].notna() &
                (df['resolution_time_minutes'] > 0) &
                (df['resolution_time_minutes'] < 1440)]
    for cause, grp in dur_df.groupby('event_cause'):
        _CAUSE_AVG_DURATION[cause] = round(grp['resolution_time_minutes'].mean(), 1)

    # Junction hotspot counts
    junc_series = df[df['junction'] != '']['junction']
    _JUNCTION_COUNTS = dict(Counter(junc_series).most_common(20))

    # Events per hour per corridor
    for corridor, grp in df.groupby('corridor'):
        hour_counts = [0] * 24
        for h, cnt in grp['hour_of_day'].value_counts().items():
            hour_counts[int(h)] = int(cnt)
        _CORRIDOR_HOUR_PROFILE[corridor] = hour_counts

_precompute()


# ══════════════════════════════════════════════════════════════════════════════
# REQUEST / RESPONSE MODELS
# ══════════════════════════════════════════════════════════════════════════════

class IncidentRequest(BaseModel):
    event_cause: str
    veh_type: str
    corridor: str
    priority: str
    time: str          # ISO format
    requires_road_closure: bool
    event_type: str
    latitude: float
    longitude: float
    police_station: str
    description: str

class Coordinate(BaseModel):
    lat: float
    lng: float

class PredictionResponse(BaseModel):
    predicted_duration_minutes: float
    personnel_needed: int
    barricades_needed: int
    diversion_route: list[Coordinate] = []
    ripple_effect_warning: str = ""
    road_closure_probability: float = 0.0   # % from historical data
    historical_avg_duration: float = 0.0    # mins, same cause
    similar_past_events: int = 0            # count of matching events
    risk_level: str = "Low"                 # Low / Medium / High / Critical


# ══════════════════════════════════════════════════════════════════════════════
# PREDICT ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/predict", response_model=PredictionResponse)
def predict_resources(request: IncidentRequest):
    # ── Time features ────────────────────────────────────────────────────────
    try:
        dt = datetime.fromisoformat(request.time.replace("Z", "+00:00"))
    except ValueError:
        dt = datetime.now()
    hour_of_day = dt.hour
    day_of_week = dt.weekday()
    is_weekend  = 1 if day_of_week in [5, 6] else 0

    priority_map     = {'Low': 1, 'Medium': 2, 'High': 3}
    corridor_priority = priority_map.get(request.priority, 1)

    severity_keywords = ['severe', 'fatal', 'fire', 'water', 'heavy', 'blast', 'accident', 'dead', 'injur']
    has_severity_keyword = 1 if any(kw in request.description.lower() for kw in severity_keywords) else 0

    input_data = pd.DataFrame([{
        'latitude': request.latitude,
        'longitude': request.longitude,
        'hour_of_day': hour_of_day,
        'day_of_week': day_of_week,
        'is_weekend': is_weekend,
        'event_cause': request.event_cause,
        'veh_type': request.veh_type,
        'corridor': request.corridor,
        'corridor_priority': corridor_priority,
        'requires_road_closure': int(request.requires_road_closure),
        'event_type': request.event_type,
        'police_station': request.police_station,
        'has_severity_keyword': has_severity_keyword,
    }])

    if model_pipeline:
        try:
            predicted_duration = float(model_pipeline.predict(input_data)[0])
        except Exception as e:
            print("Predict error:", e)
            predicted_duration = _CAUSE_AVG_DURATION.get(request.event_cause, 60.0)
    else:
        predicted_duration = _CAUSE_AVG_DURATION.get(request.event_cause, 60.0)

    predicted_duration = max(0.0, predicted_duration)

    # ── Fuzzy logic resources ────────────────────────────────────────────────
    personnel, barricades = compute_resources(predicted_duration, corridor_priority)

    # ── Historical enrichment ────────────────────────────────────────────────
    road_closure_prob   = _CAUSE_CLOSURE_RATE.get(request.event_cause, 0.0)
    historical_avg_dur  = _CAUSE_AVG_DURATION.get(request.event_cause, 0.0)

    # Count similar events in dataset
    similar_mask = (
        (_df['event_cause'] == request.event_cause) &
        (_df['corridor'] == request.corridor)
    )
    similar_past_events = int(similar_mask.sum())

    # ── Risk level ───────────────────────────────────────────────────────────
    if predicted_duration > 120 and corridor_priority == 3:
        risk_level = "Critical"
    elif predicted_duration > 60 or road_closure_prob > 40:
        risk_level = "High"
    elif predicted_duration > 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # ── Ripple effect ────────────────────────────────────────────────────────
    ripple = ""
    if predicted_duration > 60 and corridor_priority == 3:
        ripple = f"CRITICAL: Secondary congestion expected in adjacent zones within 30 min due to {predicted_duration:.0f}m clearance. Recommend preemptive signal tuning."
    elif predicted_duration > 40:
        ripple = "WARNING: Moderate ripple effect likely. Monitor adjacent junctions closely."

    # ── Mappls API Diversion Route ───────────────────────────────────────────
    base_lat, base_lng = request.latitude, request.longitude
    diversion_route = []
    
    if MAPPLS_ACCESS_TOKEN:
        # Route from slightly south-west to slightly north-east to create a diversion path
        start_lat, start_lng = base_lat - 0.005, base_lng - 0.005
        end_lat, end_lng = base_lat + 0.005, base_lng + 0.005
        
        try:
            url = f"https://apis.mappls.com/advancedmaps/v1/{MAPPLS_ACCESS_TOKEN}/route_adv/driving/{start_lng},{start_lat};{end_lng},{end_lat}?geometries=geojson"
            response = requests.get(url, timeout=4.0)
            if response.status_code == 200:
                data = response.json()
                if "routes" in data and len(data["routes"]) > 0:
                    coords = data["routes"][0]["geometry"]["coordinates"]
                    diversion_route = [{"lat": c[1], "lng": c[0]} for c in coords]
        except Exception as e:
            print("Mappls Routing API Error:", e)

    # Fallback to simulated square if API fails or token missing
    if not diversion_route:
        off = 0.005
        diversion_route = [
            {"lat": base_lat,         "lng": base_lng},
            {"lat": base_lat + off,   "lng": base_lng},
            {"lat": base_lat + off,   "lng": base_lng + off},
            {"lat": base_lat - off/2, "lng": base_lng + off},
            {"lat": base_lat - off/2, "lng": base_lng - off/2},
        ]

    return PredictionResponse(
        predicted_duration_minutes=round(predicted_duration, 1),
        personnel_needed=int(personnel),
        barricades_needed=int(barricades),
        diversion_route=diversion_route,
        ripple_effect_warning=ripple,
        road_closure_probability=road_closure_prob,
        historical_avg_duration=historical_avg_dur,
        similar_past_events=similar_past_events,
        risk_level=risk_level,
    )


# ══════════════════════════════════════════════════════════════════════════════
# ANALYTICS ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/analytics/overview")
def analytics_overview():
    """Summary stats for the dashboard header."""
    total = len(_df)
    active = int((_df['status'] == 'active').sum()) if 'status' in _df.columns else 0
    high_priority = int((_df['priority'] == 'High').sum())
    road_closures = int(_df['requires_road_closure'].sum())
    return {
        "total_events": total,
        "active_events": active,
        "high_priority": high_priority,
        "road_closures": road_closures,
    }


@app.get("/api/analytics/cause_breakdown")
def cause_breakdown():
    """Event count per cause, sorted descending."""
    counts = _df['event_cause'].value_counts().to_dict()
    result = []
    for cause, count in sorted(counts.items(), key=lambda x: -x[1]):
        result.append({
            "cause": cause,
            "count": count,
            "closure_rate": _CAUSE_CLOSURE_RATE.get(cause, 0.0),
            "avg_duration": _CAUSE_AVG_DURATION.get(cause, 0.0),
        })
    return result


@app.get("/api/analytics/hotspots")
def junction_hotspots(top: int = Query(10, ge=1, le=20)):
    """Top junction hotspots by event count."""
    result = []
    for i, (junction, count) in enumerate(list(_JUNCTION_COUNTS.items())[:top]):
        junc_df = _df[_df['junction'] == junction]
        lat = junc_df['latitude'].median()
        lng = junc_df['longitude'].median()
        result.append({
            "rank": i + 1,
            "junction": junction,
            "count": count,
            "lat": round(float(lat), 6) if pd.notna(lat) else None,
            "lng": round(float(lng), 6) if pd.notna(lng) else None,
        })
    return result


@app.get("/api/analytics/corridor_profile")
def corridor_profile(corridor: str = Query("Mysore Road")):
    """Hourly event distribution for a given corridor (24 buckets)."""
    hours = _CORRIDOR_HOUR_PROFILE.get(corridor, [0] * 24)
    return [{"hour": h, "count": hours[h]} for h in range(24)]


@app.get("/api/analytics/corridors")
def list_corridors():
    """Return all corridor names with event counts."""
    counts = _df['corridor'].value_counts().to_dict()
    return [{"corridor": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]


@app.get("/api/analytics/zone_summary")
def zone_summary():
    """Per-zone event counts and high-priority fraction."""
    result = []
    for zone, grp in _df.groupby('zone'):
        if not zone or zone == 'unknown':
            continue
        result.append({
            "zone": zone,
            "total": len(grp),
            "high_priority": int((grp['priority'] == 'High').sum()),
            "road_closures": int(grp['requires_road_closure'].sum()),
        })
    return sorted(result, key=lambda x: -x['total'])


@app.get("/api/analytics/heatmap_points")
def heatmap_points(limit: int = Query(2000, ge=100, le=5000)):
    """Return lat/lng points for heatmap rendering (sampled for performance)."""
    valid = _df[_df['latitude'].notna() & _df['longitude'].notna()].copy()
    # Weight high-priority events more
    sample = valid.sample(min(limit, len(valid)), random_state=42)
    result = []
    for _, row in sample.iterrows():
        result.append({
            "lat": round(float(row['latitude']), 5),
            "lng": round(float(row['longitude']), 5),
            "weight": 3 if row['priority'] == 'High' else 1,
        })
    return result


@app.get("/api/analytics/planned_vs_unplanned")
def planned_vs_unplanned():
    """Planned vs unplanned breakdown by cause."""
    result = []
    for etype, grp in _df.groupby('event_type'):
        causes = grp['event_cause'].value_counts().head(6).to_dict()
        result.append({"type": etype, "total": len(grp), "causes": causes})
    return result


# ── Grid Density ─────────────────────────────────────────────────────────────
# Bangalore bounding box (lat/lng)
BLAT_MIN, BLAT_MAX = 12.82, 13.18
BLNG_MIN, BLNG_MAX = 77.40, 77.80

# At lat ~13°N: 1° lat ≈ 111 km, 1° lng ≈ 108.2 km
# sqrt(0.5 km²) ≈ 0.707 km side → 0.707/111 ≈ 0.00637° lat, 0.707/108.2 ≈ 0.00653° lng
GRID_LAT = 0.0064
GRID_LNG = 0.0065

def _apply_filters(hour_start: int, hour_end: int, month: int) -> pd.DataFrame:
    df = _df.copy()
    if hour_start <= hour_end:
        df = df[(df['hour_of_day'] >= hour_start) & (df['hour_of_day'] <= hour_end)]
    else:  # overnight range e.g. 22–06
        df = df[(df['hour_of_day'] >= hour_start) | (df['hour_of_day'] <= hour_end)]
    if month > 0 and 'start_datetime' in df.columns:
        df = df[df['start_datetime'].dt.month == month]
    return df


@app.get("/api/analytics/grid_density")
def grid_density(
    hour_start: int = Query(0,  ge=0, le=23),
    hour_end:   int = Query(23, ge=0, le=23),
    month:      int = Query(0,  ge=0, le=12),   # 0 = all months
):
    """
    Divide Bengaluru into ~0.5 km² grid cells and return per-cell incident
    density with optional hour-of-day and month filters.
    """
    df = _apply_filters(hour_start, hour_end, month)

    # Restrict to Bangalore bbox and valid coords
    df = df[
        df['latitude'].between(BLAT_MIN, BLAT_MAX) &
        df['longitude'].between(BLNG_MIN, BLNG_MAX)
    ].dropna(subset=['latitude', 'longitude'])

    if len(df) == 0:
        return {"cells": [], "max_count": 0, "total_filtered": 0}

    # Assign grid row/col
    df = df.copy()
    df['grid_row'] = ((df['latitude']  - BLAT_MIN) / GRID_LAT).astype(int)
    df['grid_col'] = ((df['longitude'] - BLNG_MIN) / GRID_LNG).astype(int)

    cells = []
    for (row, col), grp in df.groupby(['grid_row', 'grid_col']):
        lat_min = round(BLAT_MIN + row * GRID_LAT, 5)
        lng_min = round(BLNG_MIN + col * GRID_LNG, 5)

        cause_counts = grp['event_cause'].value_counts()
        top_cause    = cause_counts.index[0] if len(cause_counts) else 'unknown'
        cause_brkdn  = cause_counts.head(4).to_dict()

        dur_valid = grp[grp['resolution_time_minutes'].between(0, 1440)] \
            if 'resolution_time_minutes' in grp.columns else pd.DataFrame()
        avg_dur = round(float(dur_valid['resolution_time_minutes'].mean()), 1) \
            if len(dur_valid) > 0 else None

        zone_counts  = grp['zone'].value_counts()
        dominant_zone = zone_counts.index[0] if len(zone_counts) else 'unknown'

        cells.append({
            "grid_id":      f"{row}_{col}",
            "lat_min":      lat_min,
            "lat_max":      round(lat_min + GRID_LAT, 5),
            "lng_min":      lng_min,
            "lng_max":      round(lng_min + GRID_LNG, 5),
            "center_lat":   round(lat_min + GRID_LAT / 2, 5),
            "center_lng":   round(lng_min + GRID_LNG / 2, 5),
            "count":        len(grp),
            "high_priority":int((grp['priority'] == 'High').sum()),
            "road_closures":int(grp['requires_road_closure'].sum()),
            "top_cause":    top_cause,
            "cause_breakdown": cause_brkdn,
            "avg_duration": avg_dur,
            "planned":      int((grp['event_type'] == 'planned').sum()),
            "unplanned":    int((grp['event_type'] == 'unplanned').sum()),
            "zone":         dominant_zone,
        })

    max_count = max(c['count'] for c in cells) if cells else 1
    return {
        "cells":          sorted(cells, key=lambda x: -x['count']),
        "max_count":      max_count,
        "total_filtered": int(len(df)),
    }


@app.get("/api/analytics/grid_cell_detail")
def grid_cell_detail(grid_id: str, hour_start: int = 0, hour_end: int = 23, month: int = 0):
    """Return detailed stats for a single grid cell."""
    try:
        row, col = map(int, grid_id.split('_'))
    except ValueError:
        return {"error": "Invalid grid_id"}

    df = _apply_filters(hour_start, hour_end, month)
    df = df.dropna(subset=['latitude', 'longitude'])
    df = df.copy()
    df['grid_row'] = ((df['latitude']  - BLAT_MIN) / GRID_LAT).astype(int)
    df['grid_col'] = ((df['longitude'] - BLNG_MIN) / GRID_LNG).astype(int)
    grp = df[(df['grid_row'] == row) & (df['grid_col'] == col)]

    if len(grp) == 0:
        return {"count": 0, "grid_id": grid_id}

    # Hour distribution
    hour_dist = [int((grp['hour_of_day'] == h).sum()) for h in range(24)]

    # Cause breakdown
    cause_brkdn = grp['event_cause'].value_counts().to_dict()

    dur_valid = grp[grp['resolution_time_minutes'].between(0, 1440)] \
        if 'resolution_time_minutes' in grp.columns else pd.DataFrame()

    return {
        "grid_id":       grid_id,
        "count":         len(grp),
        "high_priority": int((grp['priority'] == 'High').sum()),
        "road_closures": int(grp['requires_road_closure'].sum()),
        "planned":       int((grp['event_type'] == 'planned').sum()),
        "unplanned":     int((grp['event_type'] == 'unplanned').sum()),
        "cause_breakdown": cause_brkdn,
        "hour_distribution": hour_dist,
        "avg_duration":  round(float(dur_valid['resolution_time_minutes'].mean()), 1) if len(dur_valid) > 0 else None,
        "zone":          grp['zone'].value_counts().index[0] if len(grp) > 0 else 'unknown',
        "junctions":     grp[grp['junction'] != '']['junction'].value_counts().head(5).to_dict(),
    }

# ══════════════════════════════════════════════════════════════════════════════
# SERVE REACT FRONTEND (Must be at the very bottom)
# ══════════════════════════════════════════════════════════════════════════════

# Only mount static files if the directory exists (for deployed environments)
if os.path.isdir("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
    app.mount("/hero-image.png", StaticFiles(directory="static", html=True), name="hero-image")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse("static/index.html")

