import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

from data_pipeline import load_and_clean_data

import os
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dataset.csv')

def train_and_save_model(data_path: str = DATA_PATH, model_save_path: str = 'model.joblib'):
    print("Loading and cleaning data...")
    df = load_and_clean_data(data_path)
    print(f"Training data: {df.shape[0]} rows")

    X = df.drop(columns=['resolution_time_minutes'])
    y = df['resolution_time_minutes']

    categorical_features = ['event_cause', 'veh_type', 'corridor', 'event_type', 'police_station']
    numerical_features   = [
        'latitude', 'longitude', 'hour_of_day', 'day_of_week', 'is_weekend',
        'corridor_priority', 'requires_road_closure', 'has_severity_keyword'
    ]

    preprocessor = ColumnTransformer(transformers=[
        ('num', StandardScaler(), numerical_features),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features),
    ])

    # GradientBoosting handles skewed durations better than RandomForest
    model = GradientBoostingRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.8,
        random_state=42
    )

    clf = Pipeline(steps=[('preprocessor', preprocessor), ('model', model)])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training model (GradientBoostingRegressor)...")
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2  = r2_score(y_test, y_pred)
    print(f"MAE: {mae:.1f} minutes  |  R²: {r2:.3f}")

    joblib.dump(clf, model_save_path)
    print(f"Model saved to {model_save_path}")


if __name__ == "__main__":
    train_and_save_model()
