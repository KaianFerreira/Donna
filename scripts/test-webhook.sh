#!/bin/bash

echo "🧪 Testando Webhook do Bot WhatsApp..."
echo "====================================="

# Verificar se n8n está rodando
if ! curl -s http://localhost:5678 > /dev/null; then
    echo "❌ n8n não está rodando em localhost:5678"
    echo "Execute: docker-compose up -d"
    exit 1
fi

echo "✅ n8n está rodando!"

# Teste 1: Webhook básico
echo "🔍 Testando webhook básico..."
response=$(curl -s -X POST http://localhost:5678/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "id": "test123"
      },
      "message": {
        "conversation": "oi"
      }
    }
  }')

if [ $? -eq 0 ]; then
    echo "✅ Webhook respondeu: $response"
else
    echo "❌ Erro ao testar webhook"
fi

# Teste 2: Palavra-chave específica
echo "🔍 Testando palavra-chave 'horario'..."
curl -s -X POST http://localhost:5678/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "id": "test124"
      },
      "message": {
        "conversation": "horario"
      }
    }
  }' > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Teste de palavra-chave executado"
else
    echo "❌ Erro no teste de palavra-chave"
fi

# Teste 3: Mensagem para escalação
echo "🔍 Testando escalação..."
curl -s -X POST http://localhost:5678/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "id": "test125"
      },
      "message": {
        "conversation": "mensagem complexa que não tem palavra-chave"
      }
    }
  }' > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Teste de escalação executado"
else
    echo "❌ Erro no teste de escalação"
fi

echo ""
echo "📊 Resultados dos testes:"
echo "- Verifique os logs do n8n em: http://localhost:5678"
echo "- Acesse 'Executions' para ver as execuções"
echo "- Se configurado corretamente, você deve ver 3 execuções"
echo ""
echo "🎯 Para testar com WhatsApp real:"
echo "1. Configure sua instância no Evolution API"
echo "2. Escaneie o QR Code"
echo "3. Envie mensagens para seu número"
echo ""
echo "✅ Testes concluídos!" 