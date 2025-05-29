#!/bin/bash

echo "🤖 Configurando Bot WhatsApp com n8n..."
echo "========================================"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker encontrado!"

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p config workflows logs

# Verificar se os arquivos de configuração existem
if [ ! -f "config/keywords.json" ]; then
    echo "❌ Arquivo config/keywords.json não encontrado!"
    echo "Por favor, execute este script a partir do diretório raiz do projeto."
    exit 1
fi

echo "✅ Arquivos de configuração encontrados!"

# Iniciar os serviços
echo "🚀 Iniciando serviços..."
docker compose up -d

echo "⏳ Aguardando serviços iniciarem..."
sleep 30

# Verificar se os serviços estão rodando
if docker ps | grep -q "n8n-whatsapp-bot"; then
    echo "✅ n8n iniciado com sucesso!"
    echo "🌐 Acesse: http://localhost:5678"
    echo "👤 Usuário: admin"
    echo "🔑 Senha: admin123"
else
    echo "❌ Erro ao iniciar n8n"
fi

if docker ps | grep -q "evolution-api"; then
    echo "✅ Evolution API iniciado com sucesso!"
    echo "🌐 Acesse: http://localhost:8080"
    echo "🔑 API Key: B6D711FCDE4D4FD5936544120E713976"
else
    echo "❌ Erro ao iniciar Evolution API"
fi

echo ""
echo "📋 Próximos passos:"
echo "1. Acesse http://localhost:5678 e faça login no n8n"
echo "2. Importe o workflow do arquivo workflows/whatsapp-bot-main.json"
echo "3. Acesse http://localhost:8080 e configure sua instância do WhatsApp"
echo "4. Escaneie o QR Code com seu WhatsApp"
echo "5. Configure o webhook no Evolution API para: http://localhost:5678/webhook/whatsapp"
echo "6. Ative o workflow no n8n"
echo "7. Teste enviando uma mensagem para seu WhatsApp!"
echo ""
echo "📖 Para mais detalhes, consulte o README.md"
echo ""
echo "🎉 Setup concluído!" 