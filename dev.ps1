# Local Development Server
# Starts both backend and frontend dev servers

Write-Host "🚀 Starting Philosify Local Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Start backend dev server in background
Write-Host "📦 Starting Backend API (wrangler dev)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\api'; wrangler dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Start frontend dev server in background
Write-Host "🎨 Starting Frontend (vite dev)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\site'; npm run dev"

Write-Host ""
Write-Host "✅ Development servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8787" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop the servers" -ForegroundColor Gray
