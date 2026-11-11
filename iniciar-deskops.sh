#!/usr/bin/env bash

# DeskOps TI - Script de Inicialização Linux / macOS
set -e

echo "====================================================================="
echo "          DESKOPS TI - HELPDESK & INVENTARIO GOOGLE WORKSPACE        "
echo "====================================================================="
echo ""
echo "Iniciando o sistema localmente no seu computador..."
echo ""

# 1. Verificar se Node.js está instalado
if ! command -v node >/dev/null 2>&1; then
    echo "❌ [ERRO] O Node.js não foi encontrado!"
    echo "Instale o Node.js (v18+) em https://nodejs.org ou via gerenciador de pacotes."
    exit 1
fi

echo "✅ [1/3] Node.js detectado: $(node -v)"

# 2. Instalar dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
    echo "📦 [2/3] Instalando dependências (npm install)..."
    npm install
    echo "✅ Dependências instaladas!"
else
    echo "✅ [2/3] Dependências já instaladas."
fi

# 3. Iniciar o servidor e abrir o navegador
echo "🚀 [3/3] Iniciando o servidor em http://localhost:3000..."
echo ""
echo "💡 Dica: No navegador, clique em 'Instalar Desktop' para criar o app standalone!"
echo "Pressione CTRL+C para encerrar."
echo "====================================================================="

# Abre o navegador em segundo plano
(
  sleep 2
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "http://localhost:3000" >/dev/null 2>&1 || true
  fi
) &

npm run dev
