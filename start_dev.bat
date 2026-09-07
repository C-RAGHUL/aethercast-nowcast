@echo off
echo ===================================================
echo   Starting AetherCast Thunderstorm & Lightning
echo                 Nowcasting System
echo ===================================================

start "AetherCast Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe run.py"
timeout /t 3 /nobreak >nul
start "AetherCast Frontend (Vite React)" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 2 /nobreak >nul
start "" "http://localhost:5173"

echo Servers started!
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000
echo ===================================================
