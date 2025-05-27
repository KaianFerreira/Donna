#!/bin/bash

echo "🚀 Iniciando Bot WhatsApp com n8n e DeepSeek IA"
echo "================================================"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker primeiro."
    exit 1
fi

# Verificar se Node.js está instalado (incluindo nvm)
check_node() {
    # Tentar carregar nvm se existir
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh"
    fi
    
    # Verificar se node está disponível
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo "✅ Node.js encontrado: $NODE_VERSION"
        return 0
    else
        return 1
    fi
}

if ! check_node; then
    echo "❌ Node.js não encontrado."
    echo "💡 Instale Node.js ou verifique se o nvm está configurado:"
    echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "   nvm install node"
    exit 1
fi

# Carregar nvm para o resto do script se existir
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
fi

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    
    # Parar containers n8n apenas se foram criados por este script
    if [ "$N8N_STARTED_BY_SCRIPT" = "true" ]; then
        echo "🐳 Parando containers Docker..."
        docker compose -f docker-compose.simple.yml stop n8n 2>/dev/null
    fi
    
    # Matar processo do Baileys
    if [ ! -z "$BAILEYS_PID" ]; then
        echo "📱 Parando servidor Baileys..."
        kill $BAILEYS_PID 2>/dev/null
    fi
    
    echo "✅ Serviços parados"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

echo "📦 Verificando dependências do Baileys..."
cd whatsapp-baileys
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependências..."
    npm install
fi
cd ..

echo ""
echo "🐳 Iniciando serviços com Docker Compose..."

# Verificar se n8n já está rodando
if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
    echo "✅ n8n já está rodando em: http://localhost:5678"
    N8N_STARTED_BY_SCRIPT="false"
else
    echo "🚀 Iniciando n8n..."
    docker compose -f docker-compose.simple.yml up -d > /dev/null 2>&1
    
    N8N_STARTED_BY_SCRIPT="true"
    
    # Aguardar n8n inicializar
    echo "⏳ Aguardando n8n inicializar..."
    sleep 20
    
    # Verificar se n8n está rodando (com retry)
    echo "🔍 Verificando se n8n está respondendo..."
    for i in {1..8}; do
        if curl -s http://localhost:5678/healthz > /dev/null 2>&1 || curl -s http://localhost:5678 > /dev/null 2>&1; then
            echo "✅ n8n está respondendo!"
            break
        fi
        if [ $i -eq 8 ]; then
            echo "❌ Erro ao iniciar n8n - timeout após 40 segundos"
            echo "📋 Logs do container:"
            docker compose -f docker-compose.simple.yml logs n8n | tail -15
            exit 1
        fi
        echo "   Tentativa $i/8... aguardando mais 5 segundos"
        sleep 5
    done
    
    echo "✅ n8n rodando em: http://localhost:5678"
fi

echo "   Login: admin / admin123"

echo ""
echo "📱 Iniciando servidor Baileys..."
cd whatsapp-baileys
node server.js &
BAILEYS_PID=$!

# Aguardar Baileys inicializar
sleep 3

echo ""
echo "🎉 TUDO PRONTO!"
echo "==============="
echo ""
echo "📊 Status dos Serviços:"
echo "  • n8n:     http://localhost:5678 (admin/admin123)"
echo "  • Baileys: http://localhost:3000/status"
echo ""
echo "📋 Próximos Passos:"
echo "  1. Acesse n8n: http://localhost:5678"
echo "  2. Importe: workflows/main.json"
echo "  3. ATIVE o workflow (toggle verde)"
echo "  4. Escaneie QR Code do WhatsApp quando aparecer"
echo ""
echo "🔧 Configuração IA (Opcional):"
echo "  • Crie conta: https://platform.deepseek.com/"
echo "  • Configure API key no workflow n8n"
echo ""
echo "⚠️  Para parar tudo: Ctrl+C"
echo ""

# Manter script rodando e mostrar logs do Baileys
wait $BAILEYS_PID 