# 🚦 NammaGrid (Traffic Intelligence Engine)

**Flipkart Gridlock Hackathon 2.0 - Prototype Round 2**  
*Theme 2: Event-Driven Congestion (Planned & Unplanned)*

![NammaGrid UI Overview](https://upload.wikimedia.org/wikipedia/commons/4/4e/Bengaluru_Traffic_Police_Logo.png)

## 📌 1. Hackathon Overview

* **Host**: Flipkart in partnership with Bengaluru Traffic Police (BTP) & MapmyIndia
* **Phase**: Prototype Round 2 (Virtual Round)
* **Team**: Solo Submission
* **Theme Selected**: **THEME 2: Event-Driven Congestion (Planned & Unplanned)**

### The Operational Challenge
Political rallies, festivals, sports events, construction activities, and sudden gatherings create localized traffic breakdowns. Currently, event impact is not quantified in advance, and resource deployment is entirely experience-driven without a unified post-event learning system.

### Our Direction
NammaGrid leverages historical and real-time data to **forecast event-related traffic impact** and autonomously recommend optimal manpower, barricading, and diversion plans to the command center.

---

## 🚀 2. Project Introduction: NammaGrid

**NammaGrid** is a predictive traffic intelligence dashboard built specifically for the Bengaluru Traffic Police's traffic management system. It aggregates live simulated feeds (like BookMyShow data, weather APIs, and social media) and runs them through a custom machine learning pipeline to predict gridlock *before* it happens.

### Core Workflows
1. **Live Feed Aggregation**: The system continuously monitors inputs for planned events (Cricket matches, rallies) and unplanned events (waterlogging, accidents).
2. **AI Inference Pipeline**: A Scikit-Learn Random Forest model analyzes the event's location, crowd size, priority, and cause against historical Bengaluru traffic datasets.
3. **Fuzzy Logic Risk Assessment**: The predicted delay is passed through a fuzzy logic system to determine the ripple effect, risk level, and required physical resources (officers and barricades).
4. **Dynamic Mapping**: MapmyIndia (Mappls API) visualizes the exact blast radius of the congestion and automatically maps out an intelligent diversion route.
5. **Automated Advisory**: The system generates a one-click WhatsApp/Twitter public advisory to alert commuters instantly.

---

## 🛠️ 3. Technology Stack

### Frontend (User Interface)
* **React 19 + Vite**: High-performance rendering for the real-time command dashboard.
* **Tailwind CSS v4**: For the pristine, modern, Gridlock 2.0-inspired UI.
* **Mappls API**: Official MapmyIndia SDK integration for local geographical plotting and diversion routing.

### Backend (AI & API Services)
* **FastAPI**: Asynchronous Python web framework for lightning-fast ML inference APIs.
* **Scikit-Learn**: Machine Learning library powering the `RandomForestRegressor` delay prediction model.
* **Scikit-Fuzzy**: Implements fuzzy logic to calculate qualitative metrics (Risk Level, Resource Allocation).
* **Pandas / NumPy**: High-performance data manipulation and mathematical scaling.
* **NetworkX**: Used for graph-based alternative route generation and node traversal.

---

## 🏗️ 4. File Structure & Architecture

```text
GridlockRound2/
├── backend/                       # Python FastAPI + ML Backend
│   ├── main.py                    # Core API Router, Mappls integration, and Fuzzy Logic engine
│   ├── ml_model.py                # Scikit-Learn RandomForest Model training and prediction inference
│   ├── test_route.py              # Unit tests for Mappls API and routing engine
│   └── requirements.txt           # Python dependencies (fastapi, scikit-learn, networkx, etc.)
│
├── frontend/                      # React UI Command Center
│   ├── index.html                 # Entry point with MapmyIndia SDK script injection
│   ├── src/
│   │   ├── App.jsx                # Main Layout Controller (Sidebar + Main Panel View state)
│   │   ├── MapplsMap.jsx          # React wrapper for MapmyIndia SDK (Heatmaps, Polylines, Markers)
│   │   ├── Analytics.jsx          # Placeholder for broader city-wide analytics
│   │   ├── constants.js           # Shared enums, API URLs, and UI Config
│   │   ├── components/
│   │   │   ├── LandingPage.jsx    # Split-view hero page with scenario quick-launch
│   │   │   ├── Header.jsx         # Global navigation and Features Modal
│   │   │   ├── LiveFeeds.jsx      # Simulated API aggregator for incoming city events
│   │   │   ├── SidebarForm.jsx    # Event parameter input panel (Cause, Crowd, Location)
│   │   │   └── ResultsPanel.jsx   # Sticky dashboard for KPIs, ROI Analysis, and Map View
│   │   └── index.css              # Global Tailwind styles & custom animations
│   │
│   ├── package.json               # Node dependencies (React, Tailwind, Vite)
│   └── vite.config.js             # Vite bundler configuration
│
└── README.md                      # Project Documentation
```

---

## 🎯 5. Key Features

* **Predictive ML Engine**: Uses historical data to predict exactly how long an intersection will be blocked and calculates the geographical ripple effect.
* **Resource Optimization**: Tells the precinct exactly how many traffic officers and barricades to deploy based on event scale and predicted spillover.
* **Live Heatmap Visualization**: Draws a translucent, non-intrusive heatmap circle directly over the affected corridor on the Mappls map.
* **ROI & Impact Analysis**: Instantly calculates the total "Time Saved per Commuter" comparing the delay with and without AI-driven intervention.
* **Automated Social Broadcasting**: Floating action button that generates a pre-formatted, hashtag-ready traffic advisory for WhatsApp and Twitter.

---

## 🏁 6. Getting Started

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* Mappls API Key (Configure in `backend/.env` and `frontend/index.html`)

### Running the Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```

The application will launch on `http://localhost:5173`. Select a scenario from the landing page to trigger the predictive pipeline!
