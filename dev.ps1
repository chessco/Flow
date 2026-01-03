# PitayaCode Flow - Dev Runner (Windows)
Write-Host "Starting development environment..." -ForegroundColor Cyan

# 1. Install Backend dependencies
if (!(Test-Path "api/node_modules")) {
    Write-Host "Installing Backend dependencies..." -ForegroundColor Yellow
    Set-Location api
    npm install
    Set-Location ..
}

# 2. Install Frontend dependencies
if (!(Test-Path "frontend/node_modules")) {
    Write-Host "Installing Frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# 3. Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Blue
Set-Location api
npx prisma generate
Set-Location ..

# 4. Start services
Write-Host "Starting API and Frontend..." -ForegroundColor Green
Write-Host "Tip: Use Ctrl+C to stop both services." -ForegroundColor Gray

npx --yes concurrently -n "API,WEB" -c "blue,green" "npm run dev --prefix api" "npm run dev --prefix frontend"
