# PitayaCode Flow - Production Deploy Script (Hetzner)
# Uso: .\deploy_api_hetzner.ps1

$ErrorActionPreference = "Stop"
$SERVER_IP = "46.224.155.43"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_citaia"

Write-Host "--- Iniciando Despliegue de Produccion (Hetzner) ---" -ForegroundColor Cyan

try {
    Write-Host "Step 1: Empaquetando y subiendo código de la API de Flow..." -ForegroundColor Yellow
    
    # Comprimir api (excluyendo node_modules y dist)
    tar --exclude="node_modules" --exclude="dist" -czf deploy_flow_api.tar.gz -C . api
    
    scp -i $SSH_KEY -o StrictHostKeyChecking=no deploy_flow_api.tar.gz root@${SERVER_IP}:/opt/pitaya/flow/

    Write-Host "Step 2: Descomprimiendo y reconstruyendo..." -ForegroundColor Yellow
    
    $remoteCommands = @"
        cd /opt/pitaya/flow
        
        echo 'Descomprimiendo archivos...'
        tar -xzf deploy_flow_api.tar.gz
        rm deploy_flow_api.tar.gz
        
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
