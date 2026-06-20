# GridlockRound2

This project is a Traffic Intelligence Engine that predicts traffic incident durations and estimates required resources (personnel, barricades) using Machine Learning and Fuzzy Logic. It provides a FastAPI backend for the predictive model and a React/Vite frontend for the user interface.

## Project Structure

- `backend/`: FastAPI application, Machine Learning pipeline, and Fuzzy Logic engine.
- `frontend/`: React application built with Vite and TailwindCSS.
- `dataset.csv`: Data file used for the ML models.

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
   The frontend application will typically be available at `http://localhost:5173`.
