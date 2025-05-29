# Configuração Manual do Baileys

## �� Status Atual

✅ **Baileys corrigido e funcionando**
✅ **Servidor rodando na porta 3000**
✅ **n8n funcionando na porta 5678**
✅ **Pronto para conectar WhatsApp**

## 📱 Como Conectar seu WhatsApp

### 1. Verificar se Baileys está rodando
```bash
curl http://localhost:3000/status
# Deve retornar: {"status":"connected","timestamp":"..."}
```

### 2. Ver o QR Code
O Baileys está rodando em background. Para ver o QR Code:

```bash
# Parar o processo atual
pkill -f "node server.js"

# Iniciar novamente em primeiro plano para ver o QR Code
cd whatsapp-baileys
node server.js
```

### 3. Escanear QR Code
1. **Abra seu WhatsApp** no celular
2. **Vá em**: Menu (3 pontos) → Dispositivos conectados
3. **Clique em**: Conectar dispositivo
4. **Escaneie o QR Code** que aparece no terminal

### 4. Aguardar Conexão
Você verá:
```
✅ Conectado ao WhatsApp!
🤖 Bot pronto para receber mensagens
```

## 🔧 Configurar n8n

### 1. Acessar n8n
- URL: http://localhost:5678
- Usuário: admin
- Senha: admin123

### 2. Importar Workflow
1. Clique em "+" → "Import from file"
2. Selecione: `workflows/whatsapp-bot-baileys.json`
3. Clique em "Import"

### 3. Ativar Workflow
1. Clique no botão "Active" no canto superior direito
2. O workflow deve ficar verde (ativo)

## 🧪 Testar o Bot

### 1. Teste Manual
Envie uma mensagem para seu próprio WhatsApp:
- "oi" → Deve responder com saudação
- "ajuda" → Deve mostrar menu
- "horario" → Deve mostrar horário

### 2. Teste via API
```bash
# Testar envio de mensagem
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "SEU_NUMERO@s.whatsapp.net",
    "message": "Teste do bot!"
  }'
```

### 3. Testar Webhook n8n
```bash
curl -X POST http://localhost:5678/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "from": "5511999999999@s.whatsapp.net",
    "message": "oi",
    "messageId": "test123"
  }'
```

## 🎯 Fluxo Completo Funcionando

1. **Mensagem chega** no seu WhatsApp pessoal
2. **Baileys recebe** automaticamente
3. **Baileys envia** para n8n via webhook
4. **n8n processa** com palavras-chave configuradas
5. **n8n responde** via Baileys
6. **Baileys envia** resposta no WhatsApp

## 📋 Comandos Úteis

### Gerenciar Baileys
```bash
# Ver se está rodando
ps aux | grep "node server.js"

# Parar
pkill -f "node server.js"

# Iniciar (para ver QR Code)
cd whatsapp-baileys && node server.js

# Iniciar em background
cd whatsapp-baileys && nohup node server.js > logs.txt 2>&1 &

# Ver logs
tail -f whatsapp-baileys/logs.txt
```

### Verificar Status
```bash
# Status Baileys
curl http://localhost:3000/status

# Status n8n
curl http://localhost:5678/healthz
```

## 🚨 Próximos Passos

1. **Parar o processo atual**: `pkill -f "node server.js"`
2. **Iniciar em primeiro plano**: `cd whatsapp-baileys && node server.js`
3. **Escanear QR Code** com seu WhatsApp
4. **Importar workflow** no n8n
5. **Testar o bot** enviando mensagens

## 🎉 Resultado Final

Depois de conectar:
- ✅ WhatsApp pessoal conectado via Baileys
- ✅ Bot respondendo automaticamente
- ✅ Escalação para humano funcionando
- ✅ n8n processando mensagens

**Seu bot WhatsApp pessoal está pronto! 🚀**

## 🎯 Fluxo Completo

1. **Mensagem chega** no seu WhatsApp
2. **Baileys recebe** e processa
3. **Baileys envia** para n8n via webhook
4. **n8n processa** com palavras-chave
5. **n8n responde** via Baileys
6. **Baileys envia** resposta no WhatsApp

## 📱 Comandos Úteis

### Gerenciar Baileys
```bash
# Iniciar
cd whatsapp-baileys && node server.js

# Verificar status
curl http://localhost:3000/status

# Ver logs (se rodando em background)
ps aux | grep node
```

### Gerenciar n8n
```bash
# Ver status
docker ps

# Ver logs
docker logs n8n-simple

# Reiniciar
docker restart n8n-simple
```

## 🎉 Teste Final

Depois de tudo configurado:

1. **Envie "oi"** para seu WhatsApp
2. **Deve responder** com saudação
3. **Envie "ajuda"** 
4. **Deve mostrar** menu de opções
5. **Envie algo aleatório**
6. **Deve escalar** para humano

## 🚨 Importante

- **Mantenha o terminal do Baileys aberto** (não feche)
- **Se desconectar**, execute novamente `node server.js`
- **QR Code expira** em 30 segundos, gere novo se necessário
- **Use apenas um dispositivo** conectado por vez

## 📞 Próximos Passos

1. ✅ Baileys configurado
2. 🔄 Conectar WhatsApp (escaneie QR Code)
3. 📱 Importar workflow no n8n
4. 🧪 Testar bot
5. 🎯 Personalizar respostas 