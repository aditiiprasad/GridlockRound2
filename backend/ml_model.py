import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

from data_pipeline import load_and_clean_data

def train_and_save_model(data_path: str, model_save_path: str):
    print("Loading and cleaning data...")
    df = load_and_clean_data(data_path)
    
    X = df.drop(columns=['resolution_time_minutes'])
    y = df['resolution_time_minutes']
    
    # Define categorical and numerical features
    categorical_features = ['event_cause', 'veh_type', 'corridor', 'event_type', 'police_station']
    numerical_features = ['latitude', 'longitude', 'hour_of_day', 'day_of_week', 'is_weekend', 
                          'corridor_priority', 'requires_road_closure', 'has_severity_keyword']
    
    # Preprocessing for categorical data
    categorical_transformer = OneHotEncoder(handle_unknown='ignore')
    
    # Preprocessing for numerical data
    numerical_transformer = StandardScaler()
    
    # Bundle preprocessing for numerical and categorical data
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_transformer, numerical_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    # Define the model
    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    
    # Create and evaluate the pipeline
    clf = Pipeline(steps=[('preprocessor', preprocessor),
                          ('model', model)])
    
    # Split data into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training the model...")
    clf.fit(X_train, y_train)
    
    print("Evaluating the model...")
    y_pred = clf.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Mean Absolute Error: {mae:.2f} minutes")
    print(f"R-squared: {r2:.2f}")
    
    print(f"Saving the model to {model_save_path}...")
    joblib.dump(clf, model_save_path)
    print("Model saved successfully.")

if __name__ == "__main__":
    dataset_path = '../dataset.csv'
    model_path = 'model.joblib'
    if os.path.exists(dataset_path):
        train_and_save_model(dataset_path, model_path)
    else:
        print(f"Dataset not found at {dataset_path}")
