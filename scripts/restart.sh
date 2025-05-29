#!/bin/bash

echo "🔄 Reiniciando Bot WhatsApp..."
echo "=============================="

# Parar containers existentes
echo "⏹️ Parando containers existentes..."
docker stop n8n-whatsapp-bot evolution-api n8n-postgres postgres-evolution 2>/dev/null || true
docker rm n8n-whatsapp-bot evolution-api n8n-postgres postgres-evolution 2>/dev/null || true

# Aguardar um pouco
sleep 5

# Iniciar com configuração simplificada
echo "🚀 Iniciando com configuração simplificada..."
docker compose -f docker-compose-simple.yml up -d

echo "⏳ Aguardando serviços iniciarem..."
sleep 30

# Verificar status
echo "📊 Status dos serviços:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "✅ Serviços reiniciados!"
echo "🌐 n8n: http://localhost:5678 (admin/admin123)"
echo "🌐 Evolution API: http://localhost:8080"
echo ""
echo "📋 Próximos passos:"
echo "1. Acesse http://localhost:5678"
echo "2. Faça login (admin/admin123)"
echo "3. Importe o workflow manualmente"
echo "4. Configure o Evolution API em http://localhost:8080" 