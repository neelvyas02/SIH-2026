# BorderGuard AI: Deployment & Setup Guide

## System Requirements
- **OS**: Windows 10/11, Ubuntu 22.04 LTS, or macOS
- **CPU**: Intel Core i5 / AMD Ryzen 5 or higher
- **RAM**: Minimum 8GB (16GB recommended)
- **GPU (Optional)**: NVIDIA GPU with CUDA 11.8 / 12.x for accelerated inference. CPU mode with `yolov8n.pt` works at 12-15 FPS.

---

## 1. Local Development (Standard Mode)

### Step 1: Clone and Set Up Storage
```bash
cd "c:\Users\smitp\OneDrive\Desktop\SIH PROJECT"
mkdir -p storage/snapshots storage/clips
```

### Step 2: Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Verify the API is running by navigating to `http://localhost:8000/docs`.

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### Step 4: AI Engine / Demo Runner
```bash
cd ../ai-engine
pip install -r requirements.txt
python src/main.py --source sample_data/border_patrol.mp4
```

---

## 2. Docker Deployment (Single Command)
If Docker and Docker Compose are installed:
```bash
docker compose up --build
```
This automatically boots:
- PostgreSQL 16 on port 5432
- MediaMTX RTSP Server on port 8554
- FastAPI on port 8000
- React Frontend on port 5173
