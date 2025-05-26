const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fetch = require('node-fetch');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

let sock;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// Logger usando pino (necessário para Baileys)
const logger = pino({ level: 'silent' });

// Store para armazenar histórico por nome de usuário/grupo
const historyStore = new Map();
// Mapeamento de JID para nome
const jidToNameMap = new Map();
// Store para contatos e grupos
const contactsStore = new Map();

// ===================================================================
// SISTEMA DE DEBOUNCE PARA MENSAGENS
// ===================================================================
// Store para timers de debounce por usuário
const debounceTimers = new Map();
// Store para mensagens pendentes por usuário
const pendingMessages = new Map();

// Configurações de timing
const DEBOUNCE_DELAY = 10000; // 10 segundos para processar
const INTERACTION_RESET = 8000; // 8 segundos para cancelar se houver nova interação

// ===================================================================
// CONTADOR VISUAL NO TERMINAL
// ===================================================================
let counterInterval = null;

function startVisualCounter() {
    // Limpar interval anterior se existir
    if (counterInterval) {
        clearInterval(counterInterval);
    }
    
    counterInterval = setInterval(() => {
        if (pendingMessages.size > 0) {
            // Limpar linha anterior
            process.stdout.write('\r\x1b[K');
            
            const now = Date.now();
            const timersInfo = [];
            
            for (const [jid, data] of pendingMessages.entries()) {
                const contactName = getContactName(jid);
                const timeWaiting = now - data.timestamp;
                const timeRemaining = Math.max(0, DEBOUNCE_DELAY - timeWaiting);
                const secondsRemaining = Math.ceil(timeRemaining / 1000);
                
                // Criar barra de progresso
                const totalSeconds = DEBOUNCE_DELAY / 1000;
                const elapsedSeconds = Math.floor(timeWaiting / 1000);
                const progress = Math.min(elapsedSeconds / totalSeconds, 1);
                const barLength = 10;
                const filledLength = Math.floor(progress * barLength);
                const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
                
                if (secondsRemaining > 0) {
                    timersInfo.push(`${contactName}: [${bar}] ${secondsRemaining}s`);
                } else {
                    timersInfo.push(`${contactName}: [${bar}] processando...`);
                }
            }
            
            if (timersInfo.length > 0) {
                const counterText = `⏱️  TIMERS ATIVOS: ${timersInfo.join(' | ')}`;
                process.stdout.write(`\r${counterText}`);
            }
        } else {
            // Limpar linha se não há timers
            process.stdout.write('\r\x1b[K');
        }
    }, 1000);
}

function stopVisualCounter() {
    if (counterInterval) {
        clearInterval(counterInterval);
        counterInterval = null;
        // Limpar linha final
        process.stdout.write('\r\x1b[K');
    }
}

// Função para processar mensagem com debounce
function processMessageWithDebounce(jid, contactName, message, messageData) {
    console.log(`⏱️ [DEBOUNCE] Nova mensagem de ${contactName} - iniciando timer de ${DEBOUNCE_DELAY/1000}s`);
    
    // Cancelar timer anterior se existir
    if (debounceTimers.has(jid)) {
        console.log(`🔄 [DEBOUNCE] Cancelando timer anterior de ${contactName}`);
        clearTimeout(debounceTimers.get(jid));
    }
    
    // Armazenar mensagem pendente (sempre a mais recente)
    pendingMessages.set(jid, {
        contactName,
        message,
        messageData,
        timestamp: Date.now()
    });
    
    // Iniciar contador visual se for o primeiro timer
    if (pendingMessages.size === 1) {
        startVisualCounter();
    }
    
    // Criar novo timer
    const timer = setTimeout(async () => {
        console.log(`\n✅ [DEBOUNCE] Timer expirado para ${contactName} - processando mensagem`);
        
        const pendingData = pendingMessages.get(jid);
        if (pendingData) {
            await sendToN8n(jid, pendingData.contactName, pendingData.message, pendingData.messageData);
            
            // Limpar dados após processamento
            pendingMessages.delete(jid);
            debounceTimers.delete(jid);
            
            // Parar contador se não há mais timers
            if (pendingMessages.size === 0) {
                stopVisualCounter();
                console.log('🎯 Todos os timers processados\n');
            }
        }
    }, DEBOUNCE_DELAY);
    
    // Armazenar timer
    debounceTimers.set(jid, timer);
    
    console.log(`⏰ [DEBOUNCE] Timer configurado para ${contactName} (${DEBOUNCE_DELAY/1000}s)`);
}

// Função para verificar se deve cancelar por nova interação
function checkInteractionReset(jid, contactName) {
    if (pendingMessages.has(jid)) {
        const pendingData = pendingMessages.get(jid);
        const timeSinceLastMessage = Date.now() - pendingData.timestamp;
        
        if (timeSinceLastMessage < INTERACTION_RESET) {
            console.log(`🚫 [DEBOUNCE] Nova interação de ${contactName} em ${timeSinceLastMessage}ms - resetando timer`);
            return true;
        }
    }
    return false;
}

// Função para enviar para n8n (extraída para reutilização)
async function sendToN8n(jid, contactName, text, messageData) {
    try {
        console.log(`📤 [N8N] Processando mensagem de ${contactName}: "${text}"`);
        
        // Buscar histórico APENAS deste usuário específico (excluindo a mensagem atual)
        const allHistory = await getMessageHistory(jid, 10);
        const messageHistory = allHistory.slice(0, -1); // Remove a mensagem atual
        
        const payload = {
            from: jid,
            fromName: contactName,
            message: text,
            messageId: messageData.messageId,
            timestamp: messageData.timestamp,
            history: messageHistory
        };

        console.log(`📤 Enviando para n8n: ${messageHistory.length} mensagens de histórico específicas de ${contactName}`);

        const response = await fetch('http://localhost:5678/webhook/whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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

// ===================================================================
// FUNÇÕES ORIGINAIS (mantidas)
// ===================================================================

// Função para extrair nome do contato/grupo
function getContactName(jid, pushName = null) {
    // Verificar se já temos o nome mapeado
    if (jidToNameMap.has(jid)) {
        return jidToNameMap.get(jid);
    }
    
    let name = null;
    
    // Tentar obter do store de contatos
    if (contactsStore.has(jid)) {
        const contact = contactsStore.get(jid);
        name = contact.name || contact.notify || contact.verifiedName;
    }
    
    // Se não encontrou, usar pushName se disponível
    if (!name && pushName) {
        name = pushName;
    }
    
    // Se ainda não tem nome, extrair do JID
    if (!name) {
        if (jid.includes('@g.us')) {
            // É um grupo - tentar extrair nome do grupo
            name = `Grupo_${jid.split('@')[0].split('-')[0]}`;
        } else if (jid.includes('@s.whatsapp.net')) {
            // É um contato individual - usar número
            const number = jid.split('@')[0];
            name = `Contato_${number}`;
        } else if (jid.includes('@newsletter')) {
            // É um canal/newsletter
            name = `Canal_${jid.split('@')[0]}`;
        } else {
            // Outros tipos
            name = `Usuario_${jid.split('@')[0]}`;
        }
    }
    
    // Limpar nome (remover caracteres especiais)
    name = name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
    if (!name) {
        name = `Usuario_${Date.now()}`;
    }
    
    // Mapear JID para nome
    jidToNameMap.set(jid, name);
    
    console.log(`👤 Mapeado ${jid} -> ${name}`);
    return name;
}

// Função para processar e armazenar mensagens do histórico
function processHistoryMessages(messages) {
    if (!messages || !Array.isArray(messages)) return;
    
    let processedCount = 0;
    let newContactsCount = 0;
    
    messages.forEach(msg => {
        if (msg && msg.key && msg.message) {
            const jid = msg.key.remoteJid;
            const pushName = msg.pushName;
            const contactName = getContactName(jid, pushName);
            
            if (!historyStore.has(contactName)) {
                historyStore.set(contactName, []);
                newContactsCount++;
            }
            
            const chatHistory = historyStore.get(contactName);
            
            // Verificar se a mensagem já existe (evitar duplicatas)
            const exists = chatHistory.some(existing => existing.messageId === msg.key.id);
            if (!exists) {
                const isFromMe = msg.key.fromMe;
                let text = '';
                
                // Extrair texto da mensagem
                if (msg.message.conversation) {
                    text = msg.message.conversation;
                } else if (msg.message.extendedTextMessage?.text) {
                    text = msg.message.extendedTextMessage.text;
                } else if (msg.message.imageMessage?.caption) {
                    text = `[Imagem] ${msg.message.imageMessage.caption || ''}`;
                } else if (msg.message.videoMessage?.caption) {
                    text = `[Vídeo] ${msg.message.videoMessage.caption || ''}`;
                } else if (msg.message.documentMessage) {
                    text = `[Documento] ${msg.message.documentMessage.fileName || 'Arquivo'}`;
                } else if (msg.message.audioMessage) {
                    text = '[Áudio]';
                } else if (msg.message.stickerMessage) {
                    text = '[Sticker]';
                } else {
                    text = '[Mensagem não suportada]';
                }
                
                if (text) {
                    chatHistory.push({
                        from: isFromMe ? 'bot' : 'user',
                        text: text,
                        timestamp: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000).toISOString(),
                        messageId: msg.key.id,
                        jid: jid,
                        contactName: contactName
                    });
                    processedCount++;
                }
            }
            
            // Manter apenas as últimas 100 mensagens por chat (aumentei o limite)
            if (chatHistory.length > 100) {
                chatHistory.splice(0, chatHistory.length - 100);
            }
            
            historyStore.set(contactName, chatHistory);
        }
    });
    
    if (processedCount > 0) {
        console.log(`💾 Processadas ${processedCount} mensagens de histórico`);
        console.log(`👥 ${newContactsCount} novos contatos/grupos adicionados`);
        console.log(`📊 Total de conversas no store: ${historyStore.size}`);
    }
}

// Função para buscar histórico de mensagens por nome (apenas para o usuário específico)
async function getMessageHistory(jid, limit = 10) {
    try {
        const contactName = getContactName(jid);
        console.log(`🔍 Buscando histórico específico para ${contactName}...`);
        
        // Buscar apenas o histórico deste usuário específico
        let messages = historyStore.get(contactName) || [];
        console.log(`💾 Histórico local para ${contactName}: ${messages.length} mensagens`);
        
        // Se não temos histórico suficiente para ESTE usuário específico, tentar buscar mais do Baileys
        if (messages.length < 5 && sock) {
            try {
                console.log(`📥 Buscando histórico adicional do Baileys para ${contactName}...`);
                
                // Usar fetchMessageHistory para buscar mensagens antigas APENAS deste usuário
                if (typeof sock.fetchMessageHistory === 'function') {
                    const count = Math.max(limit, 20);
                    console.log(`🔄 Chamando fetchMessageHistory(${count}, ${jid}) para ${contactName}`);
                    const historyResult = await sock.fetchMessageHistory(count, jid);
                    
                    console.log(`📦 fetchMessageHistory para ${contactName}:`, {
                        hasMessages: !!historyResult?.messages,
                        messageCount: historyResult?.messages?.length || 0
                    });
                    
                    if (historyResult && historyResult.messages) {
                        console.log(`📚 Processando ${historyResult.messages.length} mensagens específicas de ${contactName}`);
                        
                        // Processar apenas as mensagens deste usuário específico
                        const userSpecificMessages = historyResult.messages.filter(msg => 
                            msg && msg.key && msg.key.remoteJid === jid
                        );
                        
                        if (userSpecificMessages.length > 0) {
                            processHistoryMessages(userSpecificMessages);
                            messages = historyStore.get(contactName) || [];
                            console.log(`💾 Após processamento específico: ${messages.length} mensagens para ${contactName}`);
                        }
                    }
                } else {
                    console.log('⚠️ fetchMessageHistory não está disponível');
                }
            } catch (error) {
                console.log(`⚠️ Erro ao buscar histórico adicional para ${contactName}:`, error.message);
            }
        }
        
        if (messages.length === 0) {
            console.log(`📭 Nenhuma mensagem encontrada no histórico para ${contactName}`);
            return [];
        }

        // Retornar as últimas mensagens (limitado) APENAS deste usuário
        const recentMessages = messages.slice(-limit);
        console.log(`📚 Retornando ${recentMessages.length} mensagens específicas de ${contactName}`);
        
        // Debug: Mostrar as mensagens que serão retornadas
        if (recentMessages.length > 0) {
            console.log(`📋 Últimas mensagens de ${contactName}:`);
            recentMessages.forEach((msg, index) => {
                console.log(`  ${index + 1}. [${msg.from}] ${msg.text.substring(0, 50)}${msg.text.length > 50 ? '...' : ''}`);
            });
        }
        
        return recentMessages;

    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error.message);
        return [];
    }
}

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        
        sock = makeWASocket({
            auth: state,
            logger: logger,
            // Configurar para receber histórico de mensagens
            shouldSyncHistoryMessage: msg => {
                console.log('🔄 shouldSyncHistoryMessage chamado para:', msg?.key?.remoteJid);
                return true;
            },
            syncFullHistory: false, // Não sincronizar histórico completo (apenas recente)
            markOnlineOnConnect: false // Não marcar como online automaticamente
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('\n🔲 Escaneie o QR Code abaixo com seu WhatsApp:');
                qrcode.generate(qr, { small: true });
                console.log('\n📱 Abra o WhatsApp > Menu > Dispositivos conectados > Conectar dispositivo');
            }
            
            if (connection === 'close') {
                const error = lastDisconnect?.error;
                const statusCode = error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log('❌ Conexão fechada:', error?.message || 'Erro desconhecido');
                console.log('🔍 Status code:', statusCode);
                console.log('🔍 Tentativas de reconexão:', reconnectAttempts);
                
                // Verificar se é erro de sessão corrompida
                if (isSessionError(error)) {
                    console.log('🚨 Detectado erro de sessão corrompida!');
                    
                    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                        console.log(`🧹 Tentativa ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}: Limpando sessão...`);
                        reconnectAttempts++;
                        
                        if (clearAuthSession()) {
                            console.log('🔄 Reconectando com sessão limpa...');
                            setTimeout(connectToWhatsApp, 3000);
                        } else {
                            console.log('❌ Falha ao limpar sessão. Tentando reconexão normal...');
                            setTimeout(connectToWhatsApp, 5000);
                        }
                    } else {
                        console.log('❌ Máximo de tentativas atingido. Sessão pode estar permanentemente corrompida.');
                        console.log('💡 Solução: Delete manualmente a pasta auth_info_baileys e reinicie');
                    }
                } else if (shouldReconnect) {
                    console.log('🔄 Reconectando...');
                    reconnectAttempts++;
                    setTimeout(connectToWhatsApp, 5000);
                } else {
                    console.log('🚪 Usuário deslogado. Não reconectando.');
                    reconnectAttempts = 0;
                }
            } else if (connection === 'open') {
                console.log('✅ Conectado ao WhatsApp!');
                console.log('🤖 Bot pronto para receber mensagens');
                reconnectAttempts = 0; // Reset contador ao conectar com sucesso
                
                // Debug: Listar todos os eventos disponíveis
                try {
                    const eventNames = sock.ev.eventNames ? sock.ev.eventNames() : [];
                    console.log('🔍 Eventos disponíveis:', eventNames);
                } catch (error) {
                    console.log('🔍 Não foi possível listar eventos:', error.message);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // Adicionar tratamento de erro global para o socket
        sock.ev.on('error', (error) => {
            console.error('🚨 Erro no socket WhatsApp:', error.message);
            
            if (isSessionError(error)) {
                console.log('🧹 Erro de sessão detectado, limpando autenticação...');
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    clearAuthSession();
                    setTimeout(connectToWhatsApp, 3000);
                }
            }
        });

        // Listener para sincronização de histórico (conforme documentação Baileys)
        sock.ev.on('messaging-history.set', ({ chats, contacts, messages, syncType }) => {
            console.log(`📚 [messaging-history.set] Histórico sincronizado: ${messages?.length || 0} mensagens, ${chats?.length || 0} chats, syncType: ${syncType}`);
            
            if (messages && messages.length > 0) {
                console.log('💾 Processando TODAS as mensagens do histórico sincronizado...');
                processHistoryMessages(messages);
            }
        });

        // Adicionar listeners para outros eventos de histórico
        sock.ev.on('chats.set', (chats) => {
            console.log(`📋 [chats.set] ${chats?.length || 0} chats recebidos`);
            
            // Processar informações dos chats para extrair nomes
            if (chats && chats.length > 0) {
                chats.forEach(chat => {
                    if (chat.id && chat.name) {
                        contactsStore.set(chat.id, {
                            name: chat.name,
                            type: 'chat'
                        });
                        console.log(`📋 Chat mapeado: ${chat.id} -> ${chat.name}`);
                    }
                });
            }
        });

        sock.ev.on('contacts.set', (contacts) => {
            console.log(`👥 [contacts.set] ${contacts?.length || 0} contatos recebidos`);
            
            // Processar contatos para extrair nomes
            if (contacts && contacts.length > 0) {
                contacts.forEach(contact => {
                    if (contact.id) {
                        contactsStore.set(contact.id, {
                            name: contact.name || contact.notify || contact.verifiedName,
                            notify: contact.notify,
                            verifiedName: contact.verifiedName,
                            type: 'contact'
                        });
                        const name = contact.name || contact.notify || contact.verifiedName || 'Sem nome';
                        console.log(`👤 Contato mapeado: ${contact.id} -> ${name}`);
                    }
                });
            }
        });

        sock.ev.on('messages.set', ({ messages, isLatest }) => {
            console.log(`📨 [messages.set] ${messages?.length || 0} mensagens recebidas, isLatest: ${isLatest}`);
            if (messages && messages.length > 0) {
                console.log('💾 Processando TODAS as mensagens do messages.set...');
                processHistoryMessages(messages);
            }
        });

        // Listener adicional para histórico
        sock.ev.on('chats.update', (updates) => {
            console.log(`📋 [chats.update] ${updates?.length || 0} chats atualizados`);
            
            // Atualizar informações dos chats
            if (updates && updates.length > 0) {
                updates.forEach(update => {
                    if (update.id && update.name) {
                        const existing = contactsStore.get(update.id) || {};
                        contactsStore.set(update.id, {
                            ...existing,
                            name: update.name,
                            type: existing.type || 'chat'
                        });
                        console.log(`📋 Chat atualizado: ${update.id} -> ${update.name}`);
                    }
                });
            }
        });

        // Debug: Capturar todos os eventos
        const originalEmit = sock.ev.emit;
        sock.ev.emit = function(event, ...args) {
            if (event.includes('history') || event.includes('message') || event.includes('chat')) {
                console.log(`🔍 [DEBUG] Evento disparado: ${event}`, args.length > 0 ? `com ${args.length} argumentos` : '');
            }
            return originalEmit.call(this, event, ...args);
        };

        // Receber mensagens
        sock.ev.on('messages.upsert', async (m) => {
            const message = m.messages[0];
            if (message.message) {
                const jid = message.key.remoteJid;
                const isFromMe = message.key.fromMe;
                const pushName = message.pushName;
                const contactName = getContactName(jid, pushName);
                
                let text = '';
                
                // Extrair texto da mensagem
                if (message.message.conversation) {
                    text = message.message.conversation;
                } else if (message.message.extendedTextMessage?.text) {
                    text = message.message.extendedTextMessage.text;
                } else if (message.message.imageMessage?.caption) {
                    text = `[Imagem] ${message.message.imageMessage.caption || ''}`;
                } else if (message.message.videoMessage?.caption) {
                    text = `[Vídeo] ${message.message.videoMessage.caption || ''}`;
                } else if (message.message.documentMessage) {
                    text = `[Documento] ${message.message.documentMessage.fileName || 'Arquivo'}`;
                } else if (message.message.audioMessage) {
                    text = '[Áudio]';
                } else if (message.message.stickerMessage) {
                    text = '[Sticker]';
                } else {
                    text = '[Mensagem não suportada]';
                }
                
                // Armazenar a nova mensagem no histórico local
                const newMessage = {
                    from: isFromMe ? 'bot' : 'user',
                    text: text,
                    timestamp: new Date().toISOString(),
                    messageId: message.key.id,
                    jid: jid,
                    contactName: contactName
                };
                
                if (!historyStore.has(contactName)) {
                    historyStore.set(contactName, []);
                }
                const chatHistory = historyStore.get(contactName);
                chatHistory.push(newMessage);
                
                // Manter apenas as últimas 100 mensagens
                if (chatHistory.length > 100) {
                    chatHistory.shift();
                }
                historyStore.set(contactName, chatHistory);
                
                // Debug: Mostrar estado atual do store
                console.log(`💾 ${contactName}: ${chatHistory.length} mensagens | Total conversas: ${historyStore.size}`);
                
                // Processar apenas mensagens recebidas (não enviadas por nós)
                if (!isFromMe && text) {
                    console.log(`📨 Nova mensagem de ${contactName}: ${text}`);
                    
                    // Processar mensagem com debounce
                    processMessageWithDebounce(jid, contactName, text, newMessage);
                }
            }
        });
    } catch (error) {
        console.error('❌ Erro ao conectar ao WhatsApp:', error.message);
        reconnectAttempts++;
        setTimeout(connectToWhatsApp, 5000);
    }
}

// Endpoint para enviar mensagens (chamado pelo n8n)
app.post('/send', async (req, res) => {
    try {
        let { to, message } = req.body;
        
        if (!sock) {
            return res.status(500).json({ error: 'WhatsApp não conectado' });
        }
        
        // Validar se os dados estão presentes
        if (!to || !message) {
            console.log('❌ Dados inválidos:', { to, message });
            return res.status(400).json({ error: 'Número ou mensagem não fornecidos' });
        }
        
        // Limpar e validar formato do número
        let cleanNumber = to.toString().trim();
        
        // Se já tem @s.whatsapp.net, extrair apenas o número
        if (cleanNumber.includes('@')) {
            cleanNumber = cleanNumber.split('@')[0];
        }
        
        // Remover caracteres não numéricos
        cleanNumber = cleanNumber.replace(/[^0-9]/g, '');
        
        // Validar se é um número válido (pelo menos 10 dígitos)
        if (cleanNumber.length < 10) {
            console.log('❌ Número inválido:', cleanNumber);
            return res.status(400).json({ error: 'Número de telefone inválido' });
        }
        
        // Recriar no formato correto
        const formattedNumber = cleanNumber + '@s.whatsapp.net';
        
        console.log(`📤 Enviando para ${formattedNumber}: ${message}`);
        
        // Tentar enviar a mensagem
        await sock.sendMessage(formattedNumber, { text: message });
        console.log(`✅ Mensagem enviada com sucesso!`);
        res.json({ success: true, message: 'Mensagem enviada' });
        
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error.message);
        
        // Se o erro for de JID inválido, tentar formato alternativo
        if (error.message.includes('jidDecode') || error.message.includes('user')) {
            console.log('🔄 Tentando formato alternativo...');
            try {
                let { to } = req.body;
                // Tentar com formato de grupo se for o caso
                if (to.includes('@g.us')) {
                    await sock.sendMessage(to, { text: message });
                    console.log(`✅ Mensagem enviada com formato alternativo!`);
                    return res.json({ success: true, message: 'Mensagem enviada (formato alternativo)' });
                }
            } catch (altError) {
                console.error('❌ Erro também no formato alternativo:', altError.message);
            }
        }
        
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para buscar histórico manualmente
app.get('/history/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier;
        const limit = parseInt(req.query.limit) || 10;
        
        let history = [];
        let contactName = identifier;
        let jid = identifier;
        
        // Verificar se o identifier é um JID ou nome
        if (identifier.includes('@')) {
            // É um JID
            jid = identifier;
            contactName = getContactName(jid);
            history = await getMessageHistory(jid, limit);
        } else {
            // É um nome - buscar no historyStore
            if (historyStore.has(identifier)) {
                history = historyStore.get(identifier).slice(-limit);
                // Tentar encontrar o JID correspondente
                for (const [storedJid, storedName] of jidToNameMap.entries()) {
                    if (storedName === identifier) {
                        jid = storedJid;
                        break;
                    }
                }
            }
        }
        
        res.json({
            success: true,
            identifier: identifier,
            contactName: contactName,
            jid: jid,
            count: history.length,
            history: history
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error.message);
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

// Endpoint de debug para mostrar o store
app.get('/debug/store', (req, res) => {
    const storeData = {};
    
    for (const [contactName, messages] of historyStore.entries()) {
        storeData[contactName] = {
            messageCount: messages.length,
            lastMessage: messages[messages.length - 1],
            firstMessage: messages[0],
            jid: messages[0]?.jid || 'N/A'
        };
    }
    
    // Também incluir mapeamentos
    const mappings = {};
    for (const [jid, name] of jidToNameMap.entries()) {
        mappings[jid] = name;
    }
    
    const contacts = {};
    for (const [jid, contact] of contactsStore.entries()) {
        contacts[jid] = contact;
    }
    
    res.json({
        success: true,
        storeSize: historyStore.size,
        conversations: storeData,
        jidMappings: mappings,
        contactsStore: contacts,
        timestamp: new Date().toISOString()
    });
});

// Endpoint para visualizar todas as mensagens detalhadamente
app.get('/debug/messages', (req, res) => {
    const limit = parseInt(req.query.limit) || 50; // Limite padrão de 50 mensagens por conversa
    const detailed = req.query.detailed === 'true';
    
    const allMessages = {};
    
    for (const [contactName, messages] of historyStore.entries()) {
        const limitedMessages = messages.slice(-limit); // Pegar as últimas N mensagens
        
        if (detailed) {
            // Modo detalhado - mostra todas as informações
            allMessages[contactName] = {
                jid: messages[0]?.jid || 'N/A',
                totalMessages: messages.length,
                showingLast: limitedMessages.length,
                messages: limitedMessages.map((msg, index) => ({
                    index: index + 1,
                    from: msg.from,
                    text: msg.text,
                    timestamp: msg.timestamp,
                    messageId: msg.messageId,
                    timeAgo: getTimeAgo(new Date(msg.timestamp))
                }))
            };
        } else {
            // Modo simples - só texto e remetente
            allMessages[contactName] = {
                jid: messages[0]?.jid || 'N/A',
                totalMessages: messages.length,
                showingLast: limitedMessages.length,
                messages: limitedMessages.map((msg, index) => ({
                    index: index + 1,
                    from: msg.from,
                    text: msg.text,
                    time: new Date(msg.timestamp).toLocaleString('pt-BR')
                }))
            };
        }
    }
    
    res.json({
        success: true,
        totalConversations: historyStore.size,
        messagesPerConversation: limit,
        detailed: detailed,
        conversations: allMessages,
        timestamp: new Date().toISOString()
    });
});

// Função auxiliar para calcular tempo decorrido
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
}

// Endpoint para forçar sincronização de histórico
app.post('/debug/sync-history/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier;
        let jid = identifier;
        let contactName = identifier;
        
        if (!sock) {
            return res.status(500).json({ error: 'WhatsApp não conectado' });
        }
        
        // Verificar se o identifier é um JID ou nome
        if (!identifier.includes('@')) {
            // É um nome - tentar encontrar o JID
            for (const [storedJid, storedName] of jidToNameMap.entries()) {
                if (storedName === identifier) {
                    jid = storedJid;
                    break;
                }
            }
            if (!jid.includes('@')) {
                return res.status(400).json({ error: 'JID não encontrado para este nome' });
            }
        } else {
            contactName = getContactName(jid);
        }
        
        console.log(`🔄 Forçando sincronização de histórico para ${contactName} (${jid})...`);
        
        // Tentar diferentes métodos de busca
        const methods = ['fetchMessageHistory', 'loadMessages', 'getMessages'];
        let result = null;
        
        for (const method of methods) {
            if (typeof sock[method] === 'function') {
                try {
                    console.log(`🔄 Tentando método: ${method}`);
                    result = await sock[method](20, jid);
                    console.log(`✅ ${method} funcionou:`, {
                        hasResult: !!result,
                        keys: Object.keys(result || {})
                    });
                    break;
                } catch (error) {
                    console.log(`❌ ${method} falhou:`, error.message);
                }
            } else {
                console.log(`⚠️ ${method} não está disponível`);
            }
        }
        
        res.json({
            success: true,
            identifier: identifier,
            contactName: contactName,
            jid: jid,
            result: result,
            storeSize: historyStore.get(contactName)?.length || 0
        });
        
    } catch (error) {
        console.error('❌ Erro ao forçar sincronização:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ===================================================================
// ENDPOINTS DE DEBUG PARA SISTEMA DE DEBOUNCE
// ===================================================================

// Endpoint para visualizar timers ativos
app.get('/debug/timers', (req, res) => {
    const activeTimers = {};
    const pendingData = {};
    
    // Mapear timers ativos
    for (const [jid, timer] of debounceTimers.entries()) {
        const contactName = getContactName(jid);
        activeTimers[contactName] = {
            jid: jid,
            hasTimer: !!timer,
            timerId: timer ? timer[Symbol.toPrimitive] ? timer[Symbol.toPrimitive]() : 'active' : null
        };
    }
    
    // Mapear mensagens pendentes
    for (const [jid, data] of pendingMessages.entries()) {
        const contactName = getContactName(jid);
        const timeWaiting = Date.now() - data.timestamp;
        const timeRemaining = Math.max(0, DEBOUNCE_DELAY - timeWaiting);
        
        pendingData[contactName] = {
            jid: jid,
            message: data.message,
            timestamp: new Date(data.timestamp).toISOString(),
            timeWaiting: `${Math.floor(timeWaiting/1000)}s`,
            timeRemaining: `${Math.floor(timeRemaining/1000)}s`,
            willProcessIn: timeRemaining > 0 ? `${Math.floor(timeRemaining/1000)}s` : 'processando...'
        };
    }
    
    res.json({
        success: true,
        config: {
            debounceDelay: `${DEBOUNCE_DELAY/1000}s`,
            interactionReset: `${INTERACTION_RESET/1000}s`
        },
        activeTimers: Object.keys(activeTimers).length,
        pendingMessages: Object.keys(pendingData).length,
        timers: activeTimers,
        pending: pendingData,
        timestamp: new Date().toISOString()
    });
});

// Endpoint para cancelar timer específico
app.post('/debug/cancel-timer/:identifier', (req, res) => {
    try {
        const identifier = req.params.identifier;
        let jid = identifier;
        let contactName = identifier;
        
        // Verificar se o identifier é um JID ou nome
        if (!identifier.includes('@')) {
            // É um nome - tentar encontrar o JID
            for (const [storedJid, storedName] of jidToNameMap.entries()) {
                if (storedName === identifier) {
                    jid = storedJid;
                    break;
                }
            }
            if (!jid.includes('@')) {
                return res.status(400).json({ error: 'JID não encontrado para este nome' });
            }
        } else {
            contactName = getContactName(jid);
        }
        
        // Cancelar timer se existir
        if (debounceTimers.has(jid)) {
            clearTimeout(debounceTimers.get(jid));
            debounceTimers.delete(jid);
            console.log(`\n🚫 [DEBUG] Timer cancelado manualmente para ${contactName}`);
        }
        
        // Remover mensagem pendente
        const hadPending = pendingMessages.has(jid);
        if (hadPending) {
            pendingMessages.delete(jid);
            console.log(`🗑️ [DEBUG] Mensagem pendente removida para ${contactName}`);
        }
        
        // Parar contador se não há mais timers
        if (pendingMessages.size === 0) {
            stopVisualCounter();
            console.log('🎯 Todos os timers cancelados\n');
        }
        
        res.json({
            success: true,
            identifier: identifier,
            contactName: contactName,
            jid: jid,
            hadTimer: debounceTimers.has(jid),
            hadPending: hadPending,
            action: 'cancelled'
        });
        
    } catch (error) {
        console.error('❌ Erro ao cancelar timer:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para forçar processamento imediato
app.post('/debug/force-process/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier;
        let jid = identifier;
        let contactName = identifier;
        
        // Verificar se o identifier é um JID ou nome
        if (!identifier.includes('@')) {
            // É um nome - tentar encontrar o JID
            for (const [storedJid, storedName] of jidToNameMap.entries()) {
                if (storedName === identifier) {
                    jid = storedJid;
                    break;
                }
            }
            if (!jid.includes('@')) {
                return res.status(400).json({ error: 'JID não encontrado para este nome' });
            }
        } else {
            contactName = getContactName(jid);
        }
        
        // Verificar se há mensagem pendente
        if (!pendingMessages.has(jid)) {
            return res.status(400).json({ error: 'Nenhuma mensagem pendente para este usuário' });
        }
        
        const pendingData = pendingMessages.get(jid);
        
        // Cancelar timer
        if (debounceTimers.has(jid)) {
            clearTimeout(debounceTimers.get(jid));
            debounceTimers.delete(jid);
        }
        
        // Processar imediatamente
        console.log(`\n⚡ [DEBUG] Processamento forçado para ${contactName}`);
        await sendToN8n(jid, pendingData.contactName, pendingData.message, pendingData.messageData);
        
        // Limpar dados
        pendingMessages.delete(jid);
        
        // Parar contador se não há mais timers
        if (pendingMessages.size === 0) {
            stopVisualCounter();
            console.log('🎯 Todos os timers processados\n');
        }
        
        res.json({
            success: true,
            identifier: identifier,
            contactName: contactName,
            jid: jid,
            message: pendingData.message,
            action: 'force_processed'
        });
        
    } catch (error) {
        console.error('❌ Erro ao forçar processamento:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para limpar sessão manualmente
app.post('/debug/clear-session', (req, res) => {
    try {
        console.log('\n🧹 [DEBUG] Limpeza manual de sessão solicitada');
        
        // Fechar conexão atual se existir
        if (sock) {
            try {
                sock.end();
                console.log('🔌 Conexão atual fechada');
            } catch (error) {
                console.log('⚠️ Erro ao fechar conexão:', error.message);
            }
        }
        
        // Limpar sessão
        const success = clearAuthSession();
        
        if (success) {
            console.log('✅ Sessão limpa com sucesso');
            
            // Reconectar após 3 segundos
            setTimeout(() => {
                console.log('🔄 Reconectando...');
                connectToWhatsApp();
            }, 3000);
            
            res.json({
                success: true,
                message: 'Sessão limpa com sucesso. Reconectando...',
                action: 'session_cleared'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao limpar sessão',
                action: 'clear_failed'
            });
        }
        
    } catch (error) {
        console.error('❌ Erro ao limpar sessão:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para diagnóstico de conexão
app.get('/debug/connection', (req, res) => {
    try {
        const authPath = path.join(__dirname, 'auth_info_baileys');
        const authExists = fs.existsSync(authPath);
        
        let authFiles = [];
        if (authExists) {
            try {
                authFiles = fs.readdirSync(authPath);
            } catch (error) {
                authFiles = ['Erro ao ler diretório'];
            }
        }
        
        const connectionStatus = {
            socket: {
                exists: !!sock,
                connected: sock?.user ? true : false,
                user: sock?.user || null
            },
            auth: {
                pathExists: authExists,
                files: authFiles,
                path: authPath
            },
            reconnection: {
                attempts: reconnectAttempts,
                maxAttempts: MAX_RECONNECT_ATTEMPTS
            },
            stores: {
                historyStore: historyStore.size,
                contactsStore: contactsStore.size,
                jidToNameMap: jidToNameMap.size
            },
            timestamp: new Date().toISOString()
        };
        
        res.json(connectionStatus);
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para forçar reconexão
app.post('/debug/reconnect', (req, res) => {
    try {
        console.log('\n🔄 [DEBUG] Reconexão manual solicitada');
        
        // Fechar conexão atual se existir
        if (sock) {
            try {
                sock.end();
                console.log('🔌 Conexão atual fechada');
            } catch (error) {
                console.log('⚠️ Erro ao fechar conexão:', error.message);
            }
        }
        
        // Reset contador de tentativas
        reconnectAttempts = 0;
        
        // Reconectar
        setTimeout(() => {
            console.log('🔄 Iniciando reconexão...');
            connectToWhatsApp();
        }, 2000);
        
        res.json({
            success: true,
            message: 'Reconexão iniciada',
            action: 'reconnecting'
        });
        
    } catch (error) {
        console.error('❌ Erro ao reconectar:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Função para limpar sessão corrompida
function clearAuthSession() {
    const authPath = path.join(__dirname, 'auth_info_baileys');
    console.log('🧹 Limpando sessão de autenticação corrompida...');
    
    try {
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
            console.log('✅ Sessão de autenticação removida');
        }
        reconnectAttempts = 0;
        return true;
    } catch (error) {
        console.error('❌ Erro ao limpar sessão:', error.message);
        return false;
    }
}

// Função para verificar se é erro de sessão corrompida
function isSessionError(error) {
    const errorMessage = error?.message || '';
    return errorMessage.includes('Bad MAC') || 
           errorMessage.includes('decrypt') || 
           errorMessage.includes('session') ||
           errorMessage.includes('ENOENT');
}

app.listen(3000, () => {
    console.log('🚀 Servidor Baileys rodando na porta 3000');
    console.log('📡 Endpoint para envio: http://localhost:3000/send');
    console.log('📊 Status: http://localhost:3000/status');
    console.log('🔍 Histórico: http://localhost:3000/history/:identifier');
    console.log('🐛 Debug Store: http://localhost:3000/debug/store');
    console.log('💬 Ver Mensagens: http://localhost:3000/debug/messages');
    console.log('🔄 Sync História: POST http://localhost:3000/debug/sync-history/:identifier');
    console.log('');
    console.log('🔧 DIAGNÓSTICO E LIMPEZA:');
    console.log('🩺 Diagnóstico: http://localhost:3000/debug/connection');
    console.log('🧹 Limpar Sessão: POST http://localhost:3000/debug/clear-session');
    console.log('🔄 Reconectar: POST http://localhost:3000/debug/reconnect');
    console.log('');
    console.log('⏱️ SISTEMA DE DEBOUNCE:');
    console.log('🕐 Ver Timers: http://localhost:3000/debug/timers');
    console.log('🚫 Cancelar Timer: POST http://localhost:3000/debug/cancel-timer/:identifier');
    console.log('⚡ Forçar Processo: POST http://localhost:3000/debug/force-process/:identifier');
    console.log('');
    console.log('💡 Parâmetros para /debug/messages:');
    console.log('   ?limit=N (padrão: 50) - Quantas mensagens por conversa');
    console.log('   ?detailed=true - Modo detalhado com timestamps');
    console.log('');
    console.log(`⚙️ Configuração de Debounce:`);
    console.log(`   • Delay para processar: ${DEBOUNCE_DELAY/1000}s`);
    console.log(`   • Reset por interação: ${INTERACTION_RESET/1000}s`);
    console.log('');
    console.log('📊 CONTADOR VISUAL: Timers ativos serão mostrados em tempo real');
    console.log('');
    console.log('🚨 SOLUÇÃO PARA ERROS "Bad MAC":');
    console.log('   1. Acesse: http://localhost:3000/debug/connection');
    console.log('   2. Se houver erro, use: POST http://localhost:3000/debug/clear-session');
    console.log('   3. Escaneie o QR Code novamente');
    console.log('');
    
    // Configurar limpeza ao sair
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Parando servidor...');
        stopVisualCounter();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n\n🛑 Parando servidor...');
        stopVisualCounter();
        process.exit(0);
    });
    
    connectToWhatsApp();
});
