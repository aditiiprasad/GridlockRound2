from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
from datetime import datetime
import os

from fuzzy_engine import compute_resources

app = FastAPI(title="Traffic Intelligence Engine API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
MODEL_PATH = "model.joblib"
try:
    model_pipeline = joblib.load(MODEL_PATH)
except FileNotFoundError:
    model_pipeline = None
    print(f"Warning: Model not found at {MODEL_PATH}. Prediction will return mock data or fail.")

class IncidentRequest(BaseModel):
    event_cause: str
    veh_type: str
    corridor: str
    priority: str
    time: str  # ISO format string
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

@app.post("/api/predict", response_model=PredictionResponse)
def predict_resources(request: IncidentRequest):
    # Parse time
    try:
        dt = datetime.fromisoformat(request.time.replace("Z", "+00:00"))
        hour_of_day = dt.hour
        day_of_week = dt.weekday()
        is_weekend = 1 if day_of_week in [5, 6] else 0
    except ValueError:
        # Fallback to current time if parsing fails
        dt = datetime.now()
        hour_of_day = dt.hour
        day_of_week = dt.weekday()
        is_weekend = 1 if day_of_week in [5, 6] else 0

    priority_map = {'Low': 1, 'Medium': 2, 'High': 3}
    corridor_priority = priority_map.get(request.priority, 1)

    # Process description for severity keyword
    severity_keywords = ['severe', 'fatal', 'fire', 'water', 'heavy', 'blast', 'accident', 'dead', 'injur']
    desc_lower = request.description.lower()
    has_severity_keyword = 1 if any(kw in desc_lower for kw in severity_keywords) else 0

    # Prepare features for the ML model
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
        'has_severity_keyword': has_severity_keyword
    }])

    if model_pipeline:
        try:
            predicted_duration = model_pipeline.predict(input_data)[0]
        except Exception as e:
            print("Error predicting with model:", e)
            predicted_duration = 60.0
    else:
        # Fallback dummy prediction
        predicted_duration = 60.0

    # Ensure duration is not negative
    predicted_duration = max(0.0, predicted_duration)

    # 3. Fuzzy Logic for Resources
    personnel, barricades = compute_resources(predicted_duration, corridor_priority)

    # 4. Ripple Effect Logic
    ripple_effect_warning = ""
    if predicted_duration > 60 and corridor_priority == 3:
        ripple_effect_warning = f"CRITICAL: Secondary congestion expected in adjacent zones within 30 mins due to {predicted_duration:.0f}m clearance. Recommend preemptive signal tuning."
    elif predicted_duration > 40:
        ripple_effect_warning = "WARNING: Moderate ripple effect likely. Monitor adjacent junctions closely."

    # 5. Simulated MapmyIndia Diversion Route
    # Draw a simulated bounding box polygon to represent a diversion route
    base_lat = request.latitude
    base_lng = request.longitude
    offset = 0.005 # rough offset for diversion
    
    diversion_route = [
        {"lat": base_lat, "lng": base_lng},
        {"lat": base_lat + offset, "lng": base_lng},
        {"lat": base_lat + offset, "lng": base_lng + offset},
        {"lat": base_lat - offset/2, "lng": base_lng + offset},
        {"lat": base_lat - offset/2, "lng": base_lng - offset/2},
    ]

    return PredictionResponse(
        predicted_duration_minutes=round(predicted_duration, 2),
        personnel_needed=int(personnel),
        barricades_needed=int(barricades),
        diversion_route=diversion_route,
        ripple_effect_warning=ripple_effect_warning
    )
