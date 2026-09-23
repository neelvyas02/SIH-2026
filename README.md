# BorderGuard AI 🛡️
### AI-Based Intelligent Video Analytics Platform for Border Surveillance using Existing CCTV Infrastructure

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![YOLOv8](https://img.shields.io/badge/AI-YOLOv8_%2B_ByteTrack-FF6F00.svg)](https://ultralytics.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg?logo=postgresql&logoColor=white)](https://postgresql.org)

**BorderGuard AI** is a mission-critical, edge-to-cloud intelligent video analytics system designed for border defense forces and security agencies. Rather than replacing costly existing CCTV cameras, BorderGuard AI upgrades legacy RTSP/ONVIF cameras into intelligent perimeter tripwires. The platform detects and tracks targets, performs high-precision polygon zone breach analysis, and broadcasts sub-second actionable alerts to a military-grade Dark Mode Security Operations Center (SOC) dashboard.

---

## 🌟 Key Features

- 📹 **Legacy CCTV Compatible**: Ingests standard RTSP, HLS, and ONVIF feeds from existing analog/IP cameras without hardware modifications.
- 🎯 **YOLOv8 + ByteTrack Pipeline**: High-accuracy object classification (person, vehicle, animal) with temporal trajectory association and persistent track IDs.
- 📐 **Interactive Polygon Zone Configuration**: Draw custom restricted boundaries, perimeter buffers, and zero-tolerance tripwires directly on camera feeds via an HTML5 canvas.
- 🦶 **Ground-Contact Spatial Filtering**: Evaluates intrusion at the object's ground contact point (feet/wheels) rather than centroid, virtually eliminating false alarms from camera perspective angles.
- ⏱️ **Temporal Dwell Time & Anti-Flapping**: Configurable loitering thresholds and cooldown timers to suppress alert fatigue.
- ⚡ **Sub-Second Real-Time Alerting**: Low-latency WebSocket event streaming with audible sirens, visual flash beacons, and camera matrix highlighting.
- 🔍 **Forensic Evidence Trail**: Cryptographically hashed (SHA-256) annotated snapshots and video snippets for post-incident investigation and chain-of-custody compliance.
- 🛡️ **Assists, Never Replaces, Humans**: Built strictly as a force-multiplier and decision-support system for border security operators.

---

## 🏗️ Architecture Overview

```
CCTV Cameras (RTSP) ──► AI Engine (OpenCV + YOLO + ByteTrack + Shapely)
                                   │
                           HTTP Webhook (Internal)
                                   ▼
                            FastAPI Backend Core
                           ├── PostgreSQL Database
                           ├── Static Evidence Store
                           └── WebSocket Gateway
                                   │
                          Real-time WebSockets
                                   ▼
                       React 18 Dark Mode SOC Dashboard
```

See [`docs/architecture.md`](docs/architecture.md) for the complete architecture specification.

---

## 👥 Team & Task Allocation (6 Developers)

| Member | Primary Role | Domain & Key Responsibilities |
|---|---|---|
| **Vivek** | **Team Leader & Lead Architect** | System integration, AI pipeline coordination, database schema design, code reviews. |
| **Dax** | ** Tester** |  |
| **Neel** | **Backend API & Database Developer** | PostgreSQL schemas, Alembic migrations, REST CRUD APIs, JWT authentication, RBAC. |
| **Rajveer** | **Backend & Real-Time Specialist** | AI-to-backend webhook ingestion, WebSocket connection manager, evidence file management. |
| **Eram** | **Frontend Lead & UI/UX Designer** | SOC dark mode design system, layout, interactive `ZoneCanvas` polygon drawer, responsive matrix. |
| **Shubham** | **Frontend Integration Engineer** | API client integration, WebSocket state hook (`useAlerts`), triage table, telemetry charts. |

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) PostgreSQL 15+ (SQLite fallback included automatically for instant zero-dependency execution)

### 1. Start the Backend API
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Backend runs at: `http://localhost:8000` (Interactive API docs at `http://localhost:8000/docs`)

### 2. Start the Frontend SOC Dashboard
```bash
cd frontend
npm install
npm run dev
```
Dashboard runs at: `http://localhost:5173`

### 3. Run the AI Analytics Engine (or Demo Simulator)
```bash
cd ai-engine
pip install -r requirements.txt
# Run with pre-recorded border security test clip:
python src/main.py --source sample_data/border_patrol.mp4 --camera-id b1a23e54-7890-4c12-a345-6789abcdef01
```

---

## 📋 Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, HTML5 Canvas
- **Backend API**: FastAPI (Python), Async SQLAlchemy, Pydantic v2, PyJWT, Passlib (Argon2/Bcrypt)
- **Database**: PostgreSQL 16 (with SQLite async fallback)
- **AI / Computer Vision**: Python 3.12, PyTorch, Ultralytics YOLOv8, ByteTrack, Shapely, OpenCV
- **Communication**: WebSockets (real-time alerts), REST HTTP (management), Webhooks (internal AI dispatch)
