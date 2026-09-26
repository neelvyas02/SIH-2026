# BorderGuard AI - PowerShell Platform Launcher
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "      BORDERGUARD AI - AUTONOMOUS SENTINEL PLATFORM LAUNCHER            " -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Cyan

$WorkspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[*] Starting Backend API Server (FastAPI + YOLO Engine)..." -ForegroundColor Yellow
$BackendJob = Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory "$WorkspaceRoot\backend" -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 3

Write-Host "[*] Starting Frontend SOC Dashboard (Vite + React)..." -ForegroundColor Yellow
$FrontendJob = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "$WorkspaceRoot\frontend" -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 3

Write-Host "`n=========================================================================" -ForegroundColor Green
Write-Host " [+] PLATFORM ACTIVE! Launching Web Console at http://localhost:5173/ai-engine" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Green

Start-Process "http://localhost:5173/ai-engine"

Write-Host "`nPress any key to terminate all platform background processes..." -ForegroundColor DarkYellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Stop-Process -Id $BackendJob.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $FrontendJob.Id -Force -ErrorAction SilentlyContinue
Write-Host "[+] All services cleanly stopped." -ForegroundColor Cyan
