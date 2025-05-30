#!/bin/bash

echo "🔧 Configurando Node.js para o projeto..."
echo "========================================"

# Verificar se nvm está instalado
if [ ! -f "$HOME/.nvm/nvm.sh" ]; then
    echo "❌ nvm não encontrado!"
    echo "💡 Instalando nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    echo "🔄 Recarregando configurações do bash..."
    source ~/.bashrc
    source ~/.bash_profile 2>/dev/null || true
fi

# Carregar nvm
echo "📦 Carregando nvm..."
source "$HOME/.nvm/nvm.sh"
source "$HOME/.nvm/bash_completion" 2>/dev/null || true

# Verificar se existe .nvmrc
if [ ! -f ".nvmrc" ]; then
    echo "❌ Arquivo .nvmrc não encontrado!"
    echo "📝 Criando .nvmrc com versão atual do Node.js..."
    node --version | sed 's/v//' > .nvmrc
fi

NODE_VERSION=$(cat .nvmrc)
echo "📌 Versão especificada no .nvmrc: ${NODE_VERSION}"

# Verificar se a versão está instalada
if ! nvm list | grep -q "v${NODE_VERSION}"; then
    echo "📥 Instalando Node.js v${NODE_VERSION}..."
    nvm install "${NODE_VERSION}"
else
    echo "✅ Node.js v${NODE_VERSION} já está instalado"
fi

# Usar a versão especificada
echo "🔄 Configurando Node.js v${NODE_VERSION} como padrão..."
nvm use "${NODE_VERSION}"
nvm alias default "${NODE_VERSION}"

# Verificar instalação
echo ""
echo "✅ Configuração concluída!"
echo "📊 Versões ativas:"
echo "  • Node.js: $(node --version)"
echo "  • npm: $(npm --version)"
echo "  • nvm default: $(nvm version default)"

echo ""
echo "💡 Para garantir que esta versão seja sempre usada:"
echo "   1. Execute 'source ~/.bashrc' em novos terminais"
echo "   2. Ou execute 'nvm use' no diretório do projeto"
echo "   3. O script start.sh já faz isso automaticamente"

echo ""
echo "🎯 Próximos passos:"
echo "   ./start.sh  # Para iniciar o bot" 