# PitayaCode Flow - Web Deployment Script (Hostinger)
# Uso: .\deploy_web_hostinger.ps1

$ErrorActionPreference = "Stop"

# Configuración de Hostinger
$SSH_USER = "u471794305"
$SSH_HOST = "185.212.71.206"
$SSH_PORT = "65002"
$REMOTE_PATH = "domains/flow.pitayacode.io/public_html" 

Write-Host "--- Iniciando Despliegue Web (Hostinger) ---" -ForegroundColor Cyan

try {
    # 1. Construir el proyecto
    Write-Host "Step 1: Construyendo proyecto Vite..." -ForegroundColor Yellow
    Set-Location web
    npm run build
    Set-Location ..

    # 2. Empaquetar la carpeta dist
    Write-Host "Step 2: Empaquetando carpeta dist..." -ForegroundColor Yellow
    if (Test-Path "web_deploy.tar.gz") { Remove-Item "web_deploy.tar.gz" }
    
    Set-Location web/dist
    tar -czf ../../web_deploy.tar.gz .
    Set-Location ../..

    # 3. Subir a Hostinger
    Write-Host "Step 3: Subiendo a Hostinger ($SSH_HOST)..." -ForegroundColor Yellow
    scp -P $SSH_PORT web_deploy.tar.gz "${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/"

    # 4. Extraer en el servidor
    Write-Host "Step 4: Extrayendo archivos en el servidor..." -ForegroundColor Yellow
    ssh -p $SSH_PORT "${SSH_USER}@${SSH_HOST}" "mkdir -p ${REMOTE_PATH} && cd ${REMOTE_PATH} && tar -xzf web_deploy.tar.gz && rm web_deploy.tar.gz"

    Write-Host "--- DESPLIEGUE WEB COMPLETADO CON EXITO ---" -ForegroundColor Green
}
catch {
    Write-Host "Error durante el despliegue: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    if (Test-Path "web_deploy.tar.gz") { Remove-Item "web_deploy.tar.gz" }
}
