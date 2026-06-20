import pandas as pd
import numpy as np

def load_and_clean_data(filepath: str) -> pd.DataFrame:
    # Load dataset
    df = pd.read_csv(filepath)
    
    # Drop rows where endlatitude or endlongitude is 0, or just handle missing coords
    # The requirement says: handle spatial anomalies (e.g., drop or impute rows where endlatitude or endlongitude is 0).
    # Since many end coords might be 0/null in the data, let's impute them with start coords if they are 0 or null
    df['endlatitude'] = pd.to_numeric(df['endlatitude'], errors='coerce')
    df['endlongitude'] = pd.to_numeric(df['endlongitude'], errors='coerce')
    
    df['endlatitude'] = df['endlatitude'].fillna(0)
    df['endlongitude'] = df['endlongitude'].fillna(0)
    
    # Impute missing end coordinates with start coordinates
    df.loc[df['endlatitude'] == 0, 'endlatitude'] = df['latitude']
    df.loc[df['endlongitude'] == 0, 'endlongitude'] = df['longitude']
    
    # Drop rows where start coordinates are invalid
    df = df[(df['latitude'] != 0) & (df['longitude'] != 0)]
    df = df.dropna(subset=['latitude', 'longitude'])

    # Extract temporal features
    df['created_date'] = pd.to_datetime(df['created_date'], errors='coerce', utc=True)
    df['resolved_datetime'] = pd.to_datetime(df['resolved_datetime'], errors='coerce', utc=True)
    df['closed_datetime'] = pd.to_datetime(df['closed_datetime'], errors='coerce', utc=True)
    
    # Drop rows where created_date is NaT
    df = df.dropna(subset=['created_date'])

    # Create target variable: resolution_time_minutes
    # Use resolved_datetime if available, else fallback to closed_datetime
    end_time = df['resolved_datetime'].fillna(df['closed_datetime'])
    df['resolution_time_minutes'] = (end_time - df['created_date']).dt.total_seconds() / 60.0
    
    # Drop rows where target variable could not be calculated or is negative
    df = df.dropna(subset=['resolution_time_minutes'])
    df = df[df['resolution_time_minutes'] > 0]
    
    # Extract temporal features
    df['hour_of_day'] = df['created_date'].dt.hour
    df['day_of_week'] = df['created_date'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    
    # Advanced Features
    df['requires_road_closure'] = df['requires_road_closure'].fillna(False).astype(int)
    df['event_type'] = df['event_type'].fillna('unknown')
    df['police_station'] = df['police_station'].fillna('unknown')
    
    # NLP extraction from description
    df['description'] = df['description'].fillna('').str.lower()
    severity_keywords = ['severe', 'fatal', 'fire', 'water', 'heavy', 'blast', 'accident', 'dead', 'injur']
    df['has_severity_keyword'] = df['description'].apply(
        lambda x: 1 if any(keyword in x for keyword in severity_keywords) else 0
    )
    
    # Fill NA for categorical columns to encode
    df['event_cause'] = df['event_cause'].fillna('unknown')
    df['veh_type'] = df['veh_type'].fillna('unknown')
    df['corridor'] = df['corridor'].fillna('Non-corridor')
    df['priority'] = df['priority'].fillna('Low')
    
    # Map priority to numerical scale
    priority_map = {'Low': 1, 'Medium': 2, 'High': 3}
    df['corridor_priority'] = df['priority'].map(priority_map).fillna(1)
    
    # Keep only relevant columns for the model
    features = [
        'latitude', 'longitude',
        'hour_of_day', 'day_of_week', 'is_weekend', 
        'event_cause', 'veh_type', 'corridor', 'corridor_priority',
        'requires_road_closure', 'event_type', 'police_station', 'has_severity_keyword',
        'resolution_time_minutes'
    ]
    df = df[features]
    
    return df

if __name__ == '__main__':
    df = load_and_clean_data('../dataset.csv')
    print(f"Data cleaned. Shape: {df.shape}")
    print(df.head())
    df.to_csv('cleaned_dataset.csv', index=False)
    print("Saved to cleaned_dataset.csv")
