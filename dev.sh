#!/bin/bash

# PitayaCode Flow - Dev Runner
# Este script inicializa el entorno de desarrollo completo

echo "🚀 Iniciando entorno de desarrollo de PitayaCode Flow..."

# 1. Instalar dependencias si no existen
if [ ! -d "api/node_modules" ]; then
    echo "📦 Instalando dependencias del Backend..."
    cd api && npm install && cd ..
fi

if [ ! -d "web/node_modules" ]; then
    echo "📦 Instalando dependencias del Frontend..."
    cd web && npm install && cd ..
fi

# 2. Generar cliente de Prisma
echo "💎 Generando cliente de Prisma..."
cd api && npx prisma generate && cd ..

# 3. Arrancar servicios en paralelo
echo "🔥 Arrancando API y Frontend..."

# Para Windows (PowerShell/CMD) o Linux con concurrently/npm-run-all
# Si no tienes concurrently, puedes abrir dos terminales o usar este comando:
npx concurrently \
  -n "API,WEB" \
  -c "blue,green" \
  "cd api && npm run dev" \
  "cd web && npm run dev"
