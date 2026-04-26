# PitayaCode Flow - Production Deploy Script (Hetzner)
# Uso: .\deploy_api_hetzner.ps1

$ErrorActionPreference = "Stop"
$SERVER_IP = "46.224.155.43"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_citaia"

Write-Host "--- Iniciando Despliegue de Produccion (Hetzner) ---" -ForegroundColor Cyan

try {
    Write-Host "Step 1: Conectando a $SERVER_IP y actualizando codigo..." -ForegroundColor Yellow
    
    $remoteCommands = @"
        cd /opt/pitaya/flow
        echo 'Actualizando repositorio git...'
        git fetch --all --prune
        git reset --hard origin/main
        git clean -fd
        
        echo 'Reconstruyendo contenedor flow-api-prod...'
        cd api
        docker compose -f docker-compose.prod.yml up -d --build flow-api-prod
        
        echo 'Esperando inicializacion (5s)...'
        sleep 5
        
        echo 'Estado final del contenedor:'
        docker ps --filter name=flow-api-prod
        
        echo 'Ultimos logs:'
        docker logs --tail 20 flow-api-prod
"@

    ssh -i $SSH_KEY -o StrictHostKeyChecking=no root@$SERVER_IP $remoteCommands

    Write-Host "--- DESPLIEGUE COMPLETADO CON EXITO ---" -ForegroundColor Green
}
catch {
    Write-Host "Error durante el despliegue: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
