#!/bin/bash

echo "📱 Configurando Baileys para WhatsApp Pessoal..."
echo "=============================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js já instalado: $(node --version)"
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Reinstalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ npm já instalado: $(npm --version)"
fi

# Criar diretório do projeto Baileys
echo "📁 Criando projeto Baileys..."
mkdir -p whatsapp-baileys
cd whatsapp-baileys

# Criar package.json
echo "📄 Criando package.json..."
cat > package.json << 'EOF'
{
  "name": "whatsapp-baileys-bot",
  "version": "1.0.0",
  "description": "Bot WhatsApp com Baileys e n8n",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.6.0",
    "qrcode-terminal": "^0.12.0",
    "express": "^4.18.2",
    "node-fetch": "^2.6.7"
  }
}
EOF

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Criar servidor Baileys
echo "🤖 Criando servidor Baileys..."
cat > server.js << 'EOF'
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

let sock;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: { level: 'silent' }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n🔲 Escaneie o QR Code abaixo com seu WhatsApp:');
            qrcode.generate(qr, { small: true });
            console.log('\n📱 Abra o WhatsApp > Menu > Dispositivos conectados > Conectar dispositivo');
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Conexão fechada:', lastDisconnect.error?.message);
            if (shouldReconnect) {
                console.log('🔄 Reconectando...');
                setTimeout(connectToWhatsApp, 5000);
            }
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
            console.log('🤖 Bot pronto para receber mensagens');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Receber mensagens
    sock.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        if (!message.key.fromMe && message.message) {
            const from = message.key.remoteJid;
            const text = message.message.conversation || 
                        message.message.extendedTextMessage?.text || '';
            
            console.log(`📨 Mensagem de ${from}: ${text}`);
            
            // Enviar para n8n
            try {
                const response = await fetch('http://localhost:5678/webhook/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: from,
                        message: text,
                        messageId: message.key.id,
                        timestamp: new Date().toISOString()
                    })
                });
                
                if (response.ok) {
                    console.log('✅ Mensagem enviada para n8n');
                } else {
                    console.log('⚠️ Erro ao enviar para n8n:', response.status);
                }
            } catch (error) {
                console.error('❌ Erro ao enviar para n8n:', error.message);
            }
        }
    });
}

// Endpoint para enviar mensagens (chamado pelo n8n)
app.post('/send', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        if (!sock) {
            return res.status(500).json({ error: 'WhatsApp não conectado' });
        }
        
        await sock.sendMessage(to, { text: message });
        console.log(`📤 Mensagem enviada para ${to}: ${message}`);
        res.json({ success: true, message: 'Mensagem enviada' });
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint de status
app.get('/status', (req, res) => {
    res.json({ 
        status: sock ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

app.listen(3000, () => {
    console.log('🚀 Servidor Baileys rodando na porta 3000');
    console.log('📡 Endpoint para envio: http://localhost:3000/send');
    console.log('📊 Status: http://localhost:3000/status');
    console.log('');
    connectToWhatsApp();
});
EOF

echo ""
echo "✅ Baileys configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute: cd whatsapp-baileys && npm start"
echo "2. Escaneie o QR Code com seu WhatsApp"
echo "3. Configure o n8n para usar: http://localhost:3000/send"
echo "4. Teste enviando mensagens para seu WhatsApp"
echo ""
echo "🔧 Comandos úteis:"
echo "- Iniciar: cd whatsapp-baileys && npm start"
echo "- Status: curl http://localhost:3000/status"
echo "- Logs: tail -f whatsapp-baileys/logs.txt"
echo ""
echo "🎉 Configuração concluída!" 