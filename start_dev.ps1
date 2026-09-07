Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Starting AetherCast Thunderstorm & Lightning" -ForegroundColor Yellow
Write-Host "                Nowcasting System" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$scriptDir\backend`"; .\venv\Scripts\python.exe run.py"
Start-Sleep -Seconds 2

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$scriptDir\frontend`"; npm run dev"
Start-Sleep -Seconds 2

# Open browser
Start-Process "http://localhost:5173"

Write-Host "Servers started successfully!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
