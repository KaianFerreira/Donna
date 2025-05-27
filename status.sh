#!/bin/bash

echo "📊 Status dos Serviços - Bot WhatsApp"
echo "===================================="

# Verificar n8n
echo "🐳 n8n:"
if curl -s http://localhost:5678/healthz > /dev/null; then
    echo "   ✅ Rodando em http://localhost:5678"
    echo "   🔑 Login: admin / admin123"
else
    echo "   ❌ Não está rodando"
fi

echo ""

# Verificar Baileys
echo "📱 Baileys:"
if curl -s http://localhost:3000/status > /dev/null; then
    STATUS=$(curl -s http://localhost:3000/status | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ Rodando em http://localhost:3000"
    echo "   📡 Status WhatsApp: $STATUS"
else
    echo "   ❌ Não está rodando"
fi

echo ""

# Verificar processos
echo "🔍 Processos:"
if pgrep -f "start.sh" > /dev/null; then
    echo "   ✅ Script start.sh rodando"
else
    echo "   ❌ Script start.sh não está rodando"
fi

if pgrep -f "node server.js" > /dev/null; then
    echo "   ✅ Servidor Baileys rodando"
else
    echo "   ❌ Servidor Baileys não está rodando"
fi

if docker ps | grep -q n8n; then
    echo "   ✅ Container n8n rodando"
else
    echo "   ❌ Container n8n não está rodando"
fi

echo ""
echo "🔗 Links Úteis:"
echo "   • n8n Interface: http://localhost:5678"
echo "   • Baileys Status: http://localhost:3000/status"
echo "   • Workflow: workflows/main.json" 