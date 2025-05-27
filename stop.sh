#!/bin/bash

echo "🛑 Parando Bot WhatsApp..."
echo "========================="

# Parar containers n8n
echo "📦 Parando n8n..."
docker compose -f docker-compose.simple.yml down 2>/dev/null

# Parar processo Baileys (buscar por server.js)
echo "📱 Parando Baileys..."
pkill -f "node server.js" 2>/dev/null

# Parar script start.sh se estiver rodando
echo "🔄 Parando start.sh..."
pkill -f "start.sh" 2>/dev/null

# Verificar se tudo foi parado
sleep 2

if docker ps | grep -q n8n; then
    echo "⚠️  n8n ainda rodando"
else
    echo "✅ n8n parado"
fi

if pgrep -f "node server.js" > /dev/null; then
    echo "⚠️  Baileys ainda rodando"
else
    echo "✅ Baileys parado"
fi

if pgrep -f "start.sh" > /dev/null; then
    echo "⚠️  start.sh ainda rodando"
else
    echo "✅ start.sh parado"
fi

echo ""
echo "🎉 Todos os serviços foram parados!" 