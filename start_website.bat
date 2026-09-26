@echo off
title BorderGuard AI - Autonomous Platform Launcher
color 0A
echo =========================================================================
echo       BORDERGUARD AI - AUTONOMOUS SENTINEL PLATFORM LAUNCHER
echo =========================================================================
echo.
echo [*] Initializing Backend API Server (FastAPI + YOLO Engine)...
start /b "" python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
timeout /t 3 /nobreak >nul

echo [*] Initializing Frontend SOC Dashboard (Vite + React)...
cd frontend
start /b "" npm run dev
timeout /t 3 /nobreak >nul

echo.
echo =========================================================================
echo  [+] PLATFORM READY! Opening Web Console in your default browser...
echo      URL: http://localhost:5173/ai-engine
echo.
echo  Controls:
echo    - Use the website UI to Start/Stop the AI Sentinel Engine with 1 click
echo    - Select Webcam, YouTube, RTSP, or Uploaded Video from the web dropdown
echo    - View real-time tactical video, bounding boxes, and forensic evidence
echo =========================================================================
echo.

start http://localhost:5173/ai-engine

echo Press CTRL+C to stop all services.
pause >nul
