# GridlockRound2 - Traffic Intelligence Engine (ASTraM)

This project is an AI-powered **Traffic Intelligence Engine** built for Bengaluru (ASTraM). It predicts traffic incident clearance durations, estimates required resources (personnel, barricades) using Machine Learning and Fuzzy Logic, and provides a rich analytics dashboard for density mapping and historical insights.

## Key Features

- **Predictive AI Engine**: Uses a Gradient Boosting Regression model trained on historical event data to predict clearance duration based on incident type, location, priority, and time features.
- **Resource Allocation (Fuzzy Logic)**: An IRC/MoRTH-aligned fuzzy inference system computes the exact number of personnel (0-12) and barricades (0-50) needed based on the predicted duration and corridor priority.
- **Ripple Effect & Risk Alerts**: Generates intelligent risk assessments (Low, Medium, High, Critical) and warns about secondary congestion (ripple effects) for severe incidents.
- **Interactive Analytics & Grid Mapping**: Divides the city into ~0.5 km² grid cells to render incident density heatmaps, along with detailed cell-level statistics including top causes, hourly distribution, and planned vs. unplanned splits.
- **Diversion Route Mapping**: Integrates with Mappls SDK to visualize suggested diversion routes around the incident coordinate.

## Architecture & Technology Stack

### Backend (Python / FastAPI)
- **Framework**: FastAPI for high-performance API endpoints.
- **Machine Learning**: `scikit-learn` (GradientBoostingRegressor), `pandas`, `joblib` for model training and inference.
- **Fuzzy Logic**: `scikit-fuzzy` for rule-based resource calculations.
- **Pre-computed Analytics**: Loads full anonymized traffic incident data (`dataset.csv`) to serve fast aggregation endpoints.

### Frontend (React / Vite)
- **Framework**: React.js built with Vite.
- **Styling**: TailwindCSS, Vanilla CSS with a dark glassmorphism aesthetic.
- **Mapping & Charts**: `recharts` for interactive analytics, `leaflet` for grid mapping, and Mappls map integration for diversion routing.

## Setup & Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (for the frontend)
- [Python 3.8+](https://www.python.org/) (for the backend)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows
   .\venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   The backend API will be available at `http://localhost:8000`. You can access the API documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend application will be available at `http://localhost:5173`.
