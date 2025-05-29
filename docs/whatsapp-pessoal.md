# Bot WhatsApp Pessoal (Não Business)

## 🎯 Opções para WhatsApp Pessoal

### Opção 1: Baileys + n8n (Recomendado)
Baileys é uma biblioteca que simula o WhatsApp Web e funciona com contas pessoais.

#### Configuração Baileys
```bash
# 1. Instalar Node.js se não tiver
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Criar projeto Baileys
mkdir whatsapp-baileys
cd whatsapp-baileys
npm init -y
npm install @whiskeysockets/baileys qrcode-terminal
```

#### Código Baileys Básico
```javascript
// server.js
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

let sock;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('Escaneie o QR Code com seu WhatsApp:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexão fechada devido a ', lastDisconnect.error, ', reconectando ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
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
            
            console.log(`Mensagem de ${from}: ${text}`);
            
            // Enviar para n8n
            try {
                await fetch('http://localhost:5678/webhook/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: from,
                        message: text,
                        messageId: message.key.id
                    })
                });
            } catch (error) {
                console.error('Erro ao enviar para n8n:', error);
            }
        }
    });
}

// Endpoint para enviar mensagens (chamado pelo n8n)
app.post('/send', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        await sock.sendMessage(to, { text: message });
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('🚀 Servidor Baileys rodando na porta 3000');
    connectToWhatsApp();
});
```

### Opção 2: WhatsApp Web.js
Alternativa ao Baileys, também funciona com contas pessoais.

```bash
# Instalar WhatsApp Web.js
npm install whatsapp-web.js puppeteer
```

```javascript
// whatsapp-webjs.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('Escaneie o QR Code:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp Web.js conectado!');
});

client.on('message', async (message) => {
    console.log(`Mensagem de ${message.from}: ${message.body}`);
    
    // Enviar para n8n
    try {
        await fetch('http://localhost:5678/webhook/whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: message.from,
                message: message.body,
                messageId: message.id.id
            })
        });
    } catch (error) {
        console.error('Erro ao enviar para n8n:', error);
    }
});

// Endpoint para enviar mensagens
app.post('/send', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        await client.sendMessage(to, message);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('🚀 Servidor WhatsApp Web.js na porta 3000');
    client.initialize();
});
```

### Opção 3: Evolution API (Configuração Manual)
Vou tentar configurar o Evolution API corretamente para WhatsApp pessoal.

```bash
# Parar containers problemáticos
docker stop evolution-working 2>/dev/null || true
docker rm evolution-working 2>/dev/null || true

# Clonar Evolution API
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Configurar
cp .env.example .env
```

## 🚀 Configuração Recomendada: Baileys

Vou criar um setup completo com Baileys:

### 1. Instalar Dependências
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 2. Criar Projeto Baileys
```bash
mkdir whatsapp-baileys
cd whatsapp-baileys
npm init -y
npm install @whiskeysockets/baileys qrcode-terminal express node-fetch
```

### 3. Configurar n8n para Baileys
No workflow do n8n, altere as URLs de envio para:
- URL: `http://localhost:3000/send`
- Método: POST
- Body: `{"to": "{{$json.from}}", "message": "{{$json.response}}"}`

### 4. Fluxo Completo
1. **Baileys** recebe mensagens do WhatsApp
2. **Baileys** envia para n8n via webhook
3. **n8n** processa com palavras-chave
4. **n8n** responde via Baileys
5. **Baileys** envia resposta no WhatsApp

## 🎯 Vantagens de Cada Opção

### Baileys
✅ Mais estável e atualizado
✅ Suporte ativo da comunidade
✅ Funciona com WhatsApp pessoal
✅ Não precisa de navegador

### WhatsApp Web.js
✅ Interface mais simples
✅ Boa documentação
✅ Funciona com WhatsApp pessoal
❌ Precisa do Puppeteer (mais pesado)

### Evolution API
✅ Interface web bonita
✅ Múltiplas instâncias
❌ Mais complexo de configurar
❌ Problemas com Docker

## 📱 Próximos Passos

1. **Escolha uma opção** (recomendo Baileys)
2. **Configure o ambiente**
3. **Escaneie o QR Code** com seu WhatsApp pessoal
4. **Teste o bot**

Qual opção você prefere? Posso te ajudar a configurar qualquer uma delas! 