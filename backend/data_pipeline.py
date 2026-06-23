import pandas as pd
import numpy as np
import os

CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dataset.csv')
# CSV_PATH = '/home/bala/myfiles/Hackathons/gridlock2.0/Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv
def load_and_clean_data(filepath: str = CSV_PATH) -> pd.DataFrame:
    df = pd.read_csv(filepath)

    # ── Coordinate cleanup ──────────────────────────────────────────────────
    df['endlatitude']  = pd.to_numeric(df['endlatitude'],  errors='coerce').fillna(0)
    df['endlongitude'] = pd.to_numeric(df['endlongitude'], errors='coerce').fillna(0)
    df.loc[df['endlatitude']  == 0, 'endlatitude']  = df['latitude']
    df.loc[df['endlongitude'] == 0, 'endlongitude'] = df['longitude']
    df = df[(df['latitude'] != 0) & (df['longitude'] != 0)].dropna(subset=['latitude', 'longitude'])

    # ── Parse timestamps ─────────────────────────────────────────────────────
    df['start_datetime']   = pd.to_datetime(df['start_datetime'],   errors='coerce', utc=True)
    df['closed_datetime']  = pd.to_datetime(df['closed_datetime'],  errors='coerce', utc=True)

    df = df.dropna(subset=['start_datetime'])

    # ── Target variable: use closed_datetime (7k+ rows) ─────────────────────
    # This replaces the old approach that used resolved_datetime (~71 rows only).
    df['resolution_time_minutes'] = (
        df['closed_datetime'] - df['start_datetime']
    ).dt.total_seconds() / 60.0

    df = df.dropna(subset=['resolution_time_minutes'])
    df = df[(df['resolution_time_minutes'] > 0) & (df['resolution_time_minutes'] < 1440)]  # 0–24 h

    # ── Temporal features ────────────────────────────────────────────────────
    df['hour_of_day'] = df['start_datetime'].dt.hour
    df['day_of_week'] = df['start_datetime'].dt.dayofweek
    df['is_weekend']  = df['day_of_week'].isin([5, 6]).astype(int)

    # ── Categorical cleanup ──────────────────────────────────────────────────
    df['requires_road_closure'] = (
        df['requires_road_closure'].astype(str).str.upper() == 'TRUE'
    ).astype(int)

    df['event_type']     = df['event_type'].fillna('unknown')
    df['police_station'] = df['police_station'].fillna('unknown')
    df['event_cause']    = df['event_cause'].fillna('unknown')
    df['veh_type']       = df['veh_type'].fillna('unknown')
    df['corridor']       = df['corridor'].fillna('Non-corridor')
    df['priority']       = df['priority'].replace('NULL', 'Low').fillna('Low')
    df['zone']           = df['zone'].replace('NULL', 'unknown').fillna('unknown')
    df['junction']       = df['junction'].fillna('unknown')

    # ── Priority → numeric ───────────────────────────────────────────────────
    priority_map = {'Low': 1, 'Medium': 2, 'High': 3}
    df['corridor_priority'] = df['priority'].map(priority_map).fillna(1)

    # ── NLP severity keyword flag ────────────────────────────────────────────
    df['description'] = df['description'].fillna('').str.lower()
    severity_kw = ['severe', 'fatal', 'fire', 'water', 'heavy', 'blast', 'accident', 'dead', 'injur']
    df['has_severity_keyword'] = df['description'].apply(
        lambda x: 1 if any(kw in x for kw in severity_kw) else 0
    )

    features = [
        'latitude', 'longitude',
        'hour_of_day', 'day_of_week', 'is_weekend',
        'event_cause', 'veh_type', 'corridor', 'corridor_priority',
        'requires_road_closure', 'event_type', 'police_station',
        'has_severity_keyword', 'resolution_time_minutes'
    ]
    return df[features]


def load_full_data(filepath: str = CSV_PATH) -> pd.DataFrame:
    """Return the full cleaned dataset (with extra analytics columns) for the /api/analytics endpoints."""
    df = pd.read_csv(filepath)

    df['start_datetime']  = pd.to_datetime(df['start_datetime'],  errors='coerce', utc=True)
    df['closed_datetime'] = pd.to_datetime(df['closed_datetime'], errors='coerce', utc=True)
    df = df.dropna(subset=['start_datetime'])

    df['hour_of_day'] = df['start_datetime'].dt.hour
    df['day_of_week'] = df['start_datetime'].dt.dayofweek

    df['event_cause']  = df['event_cause'].fillna('unknown').str.strip()
    df['corridor']     = df['corridor'].fillna('Non-corridor').str.strip()
    df['zone']         = df['zone'].replace('NULL', 'unknown').fillna('unknown').str.strip()
    df['junction']     = df['junction'].replace('NULL', '').fillna('').str.strip()
    df['priority']     = df['priority'].replace('NULL', 'Low').fillna('Low')
    df['event_type']   = df['event_type'].fillna('unknown')
    df['requires_road_closure'] = (
        df['requires_road_closure'].astype(str).str.upper() == 'TRUE'
    ).astype(int)

    # Duration for rows that have both timestamps
    df['resolution_time_minutes'] = (
        df['closed_datetime'] - df['start_datetime']
    ).dt.total_seconds() / 60.0

    df['latitude']  = pd.to_numeric(df['latitude'],  errors='coerce')
    df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')

    return df


if __name__ == '__main__':
    df = load_and_clean_data()
    print(f"Training data shape: {df.shape}")
    print(df['resolution_time_minutes'].describe().round(1))
