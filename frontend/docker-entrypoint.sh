#!/bin/sh
set -e

# Si node_modules no existe o está vacío, instalar dependencias
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "📦 Instalando dependencias..."
  npm install
fi

echo "🚀 Iniciando Vite dev server..."
exec npm run dev -- --host 0.0.0.0 --port 5173
