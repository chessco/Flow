# PitayaCode Flow - Dev Runner (Windows)
Write-Host "Starting development environment..." -ForegroundColor Cyan

# 0. Start Database (Docker)
Write-Host "Ensuring database container is running..." -ForegroundColor Yellow
docker-compose up -d db

# 1. Install Backend dependencies
if (!(Test-Path "api/node_modules")) {
    Write-Host "Installing Backend dependencies..." -ForegroundColor Yellow
    Set-Location api
    npm install
    Set-Location ..
}

# 2. Install Frontend dependencies
if (!(Test-Path "web/node_modules")) {
    Write-Host "Installing Frontend dependencies..." -ForegroundColor Yellow
    Set-Location web
    npm install
    Set-Location ..
}

# 3. Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Blue
Set-Location api
npx prisma generate
Set-Location ..

# 4. Start services in independent windows
Write-Host "Launching API and Frontend in separate windows..." -ForegroundColor Green

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; `$Host.UI.RawUI.WindowTitle = 'Flow - API'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd web; `$Host.UI.RawUI.WindowTitle = 'Flow - Web'; npm run dev"

Write-Host "Done! Services are running in their own windows." -ForegroundColor Gray
