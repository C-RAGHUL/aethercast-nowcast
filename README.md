# AetherCast: AI/ML-Based Thunderstorm & Lightning Nowcasting Prototype

> An end-to-end meteorological nowcasting system that predicts convective storm cell initiation, semi-Lagrangian advection, and multi-tiered lightning strike risk for the next **30 to 120 minutes** (in 15-minute intervals).

Built with **React 18 + Leaflet + Tailwind CSS** on the frontend, and **Python FastAPI + Scikit-Learn Ensemble Models** on the backend, featuring an extensible provider architecture ready for operational radar, satellite, and lightning networks.

---

## ⚡ Key Features

1. **AI/ML Nowcasting Engine (0–120 Minutes)**:
   - **Semi-Lagrangian Advection**: Computes storm steering velocity vectors and extrapolates cell centroids forward in time with dynamic uncertainty cones ($\sigma(t)$).
   - **Convective Life-Cycle Modeling**: Models cell intensification, plateau, dissipation, and boundary initiation based on satellite cloud-top cooling rates ($\Delta T / \Delta t$) and thermodynamic soundings.
   - **Calibrated Multi-Tiered Risk Envelopes**:
     - 🟡 **Low Risk (25–50% Prob)**: Perimeter watch and flanking stratiform rain.
     - 🟠 **Medium Risk (50–75% Prob)**: Active convection and gust front.
     - 🔴 **High Risk (>75% Prob)**: Severe core, heavy lightning density ($>30\text{ fl/km}^2/\text{hr}$), and hail potential.
   - **Meteorological Contingency Evaluation**: Built-in validation reporting Critical Success Index (CSI / Threat Score: **0.74**), Probability of Detection (POD: **0.89**), False Alarm Ratio (FAR: **0.18**), and ROC-AUC (**0.90**).

2. **Extensible Sensor & Provider Architecture**:
   - Clean, abstract interfaces (`backend/app/providers/base.py`) for:
     - **Radar Provider**: NOAA NEXRAD WSR-88D AWS S3 Open Data / Unidata adapter ready.
     - **Satellite Provider**: NOAA GOES-16/18 ABI Clean IR (Band 13) adapter ready.
     - **Lightning Provider**: NOAA GOES Geostationary Lightning Mapper (GLM) & Blitzortung TOA network adapter ready.
     - **Atmospheric NWP Provider**: HRRR / RAP thermodynamic soundings (CAPE, CIN, 0–6km Bulk Shear).
   - **High-Fidelity Synthetic Simulation Engine**:
     - Procedurally simulates multi-cell squall lines, bow echoes, isolated rotating supercells, pop-up pulse storms, and dryline convective initiation.

3. **Modern Meteorological Workstation Console (React)**:
   - Dark tactical radar theme (CartoDB Dark Matter tiles).
   - **0–120 Minute Scrubber & Auto-Play**: Play, pause, step forward/backward, and speed toggle (1x, 2x, 4x).
   - **Multi-Layer Radar Display**:
     - Low, Medium, and High risk polygons with animated hazard borders.
     - Radar reflectivity contours with standard NWS 16-color palette (30, 40, 50, 60+ dBZ).
     - Pulsing lightning strike strobe markers (Cloud-to-Ground vs. Intra-Cloud) with decay age rings.
     - Storm cell motion vectors and 30m / 60m / 90m / 120m forecast waypoints.
   - **Click-to-Inspect Point Meteogram**:
     - Click anywhere on the map to query the 120-minute thunderstorm probability curve, rain rate (Marshall-Palmer relation), hail hazard, and AI feature attribution.
   - **Interactive Modals**:
     - **API & Sensor Architecture Modal**: Live connector statuses and code hooks for plugging in real APIs.
     - **AI Model Performance Modal**: Contingency matrix (Hits, False Alarms, Misses), CSI, and Gini feature importances.

---

## 📁 System Architecture

```
thunderstorm-nowcast/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── nowcast.py              # FastAPI REST endpoints
│   │   ├── core/
│   │   │   ├── config.py               # Domain boundaries, time intervals, thresholds
│   │   │   └── schemas.py              # Pydantic schemas & GeoJSON models
│   │   ├── models/
│   │   │   ├── ml_nowcaster.py         # AI/ML Nowcasting Engine & Risk Contouring
│   │   │   └── trainer.py              # Synthetic training & CSI/POD/FAR evaluation
│   │   ├── providers/
│   │   │   ├── base.py                 # Abstract Base Classes for Radar, Sat, Lightning
│   │   │   ├── synthetic_provider.py   # High-fidelity physics-based convective simulator
│   │   │   ├── nexrad_adapter.py       # NOAA NEXRAD AWS S3 adapter template
│   │   │   ├── goes_adapter.py         # GOES-16 ABI & GLM adapter template
│   │   │   └── blitzortung_adapter.py  # Blitzortung TOA network adapter template
│   │   └── main.py                     # FastAPI app with CORS & health checks
│   ├── requirements.txt                # FastAPI, Uvicorn, NumPy, Scipy, Scikit-learn
│   ├── run.py                          # Backend startup runner
│   └── verify_backend.py               # Comprehensive verification test suite
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   │   └── NowcastMap.tsx      # Leaflet interactive map with custom layers
│   │   │   ├── Controls/
│   │   │   │   ├── TimelinePlayer.tsx  # 0-120 min scrubber & playback controls
│   │   │   │   └── LayerControls.tsx   # Overlays toggle panel
│   │   │   ├── Panels/
│   │   │   │   ├── NowcastSidebar.tsx  # Storm telemetry, scenario selector, cell list
│   │   │   │   └── PointInspector.tsx  # 120-min point meteogram & AI attribution
│   │   │   └── Modals/
│   │   │       ├── ArchitectureModal.tsx # Sensor API connectors & integration guide
│   │   │       └── ModelMetricsModal.tsx # Contingency table & CSI evaluation
│   │   ├── types/
│   │   │   └── nowcast.ts              # TypeScript domain types
│   │   ├── App.tsx                     # Main workstation layout & state management
│   │   ├── index.css                   # Tailwind CSS & Leaflet custom styling
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── start_dev.bat                       # Windows one-click starter
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (tested on Python 3.13)
- **Node.js 18+** & npm

### 1. Backend Setup & Startup
```powershell
# Navigate to backend directory
cd backend

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# (Optional) Run verification suite
python verify_backend.py

# Start the FastAPI backend server
python run.py
```
The backend will be live at:
- **API Root**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive OpenAPI Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend Setup & Startup
```powershell
# In a new terminal, navigate to frontend directory
cd frontend

# Start Vite development server
npm run dev
```
The workstation will be live at:
- **Frontend Console**: [http://localhost:5173](http://localhost:5173)

---

## 📡 Plugging in Real-World Radar, Satellite & Lightning APIs

The provider architecture is designed so you never have to alter the ML engine or React frontend when swapping mock data for live feeds:

1. **NOAA NEXRAD Radar (AWS Open Data)**:
   - Connect via `NexradRadarAdapter` in `app/providers/nexrad_adapter.py`.
   - Reads level-2 volume archives from `s3://noaa-nexrad-level2/` without AWS account credentials.
2. **NOAA GOES-16/18 ABI & GLM (AWS Open Data)**:
   - Connect via `GoesSatelliteAdapter` and `GoesGlmLightningAdapter` in `app/providers/goes_adapter.py`.
   - Fetches 10.35 µm Clean IR (Band 13) for rapid cloud-top cooling and GLM total flash events from `s3://noaa-goes16/`.
3. **Blitzortung Community Lightning Network**:
   - Connect via `BlitzortungLightningAdapter` in `app/providers/blitzortung_adapter.py` via WebSocket or HTTP feed.
4. **NOAA HRRR / RAP NWP Soundings**:
   - Connect via `get_thermodynamic_profile` to supply live CAPE, CIN, and 0–6km vertical wind shear.

---

## 🧪 Verification & Validation

Run the automated backend test harness:
```powershell
python backend/verify_backend.py
```
This tests:
- Synthetic convective cell generation and physical eastward advection
- Stochastic lightning flash generation
- Multi-tier GeoJSON risk zone synthesis (Low, Medium, High)
- Point forecast meteogram generation
- AI Model Training and CSI/POD/FAR metrics evaluation
- FastAPI endpoint responses (`/forecast`, `/timeline`, `/point`, `/providers`)
