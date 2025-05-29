# Configuração Manual - Bot WhatsApp

## 🎯 Status Atual

✅ **n8n funcionando**: http://localhost:5678 (admin/admin123)
❌ **Evolution API**: Problemas com configuração

## 🚀 Configuração Atual Funcionando

### n8n Ativo
```bash
# Container atual funcionando:
docker ps
# Deve mostrar: n8n-simple rodando na porta 5678
```

**Acesso**: http://localhost:5678
- **Usuário**: admin
- **Senha**: admin123

## 📋 Próximos Passos

### 1. Configurar n8n

1. **Acesse**: http://localhost:5678
2. **Faça login** com admin/admin123
3. **Importe o workflow**:
   - Clique em "+" → "Import from file"
   - Selecione: `workflows/whatsapp-bot-main.json`

### 2. Alternativas para WhatsApp

Como o Evolution API está com problemas, você pode usar:

#### Opção A: WhatsApp Web API (Recomendado)
```bash
# Use uma API externa como:
# - Twilio WhatsApp API
# - Meta WhatsApp Business API
# - ChatAPI
```

#### Opção B: Evolution API Manual
```bash
# Clone e configure manualmente:
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api
npm install
npm run start:dev
```

#### Opção C: Baileys (Mais técnico)
```bash
# Use diretamente a biblioteca Baileys no n8n
# Configuração via código JavaScript
```

### 3. Configurar Webhook no n8n

1. **No n8n**, crie um webhook:
   - URL: `http://localhost:5678/webhook/whatsapp`
   - Método: POST

2. **Configure o workflow** para processar mensagens

### 4. Testar o Bot

#### Teste Manual do Webhook
```bash
# Execute o script de teste:
./scripts/test-webhook.sh

# Ou teste manualmente:
curl -X POST http://localhost:5678/webhook/whatsapp \
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
  }'
```

## 🔧 Comandos Úteis

### Gerenciar Containers
```bash
# Ver containers rodando
docker ps

# Ver logs do n8n
docker logs n8n-simple

# Reiniciar n8n
docker restart n8n-simple

# Parar tudo
docker stop n8n-simple
```

### Backup dos Dados
```bash
# Backup do volume do n8n
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n-backup.tar.gz -C /data .

# Restaurar backup
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar xzf /backup/n8n-backup.tar.gz -C /data
```

## 🎯 Workflow Simplificado

Como o Evolution API não está funcionando, você pode:

1. **Usar n8n com HTTP Request nodes** para APIs externas
2. **Configurar webhooks** para receber mensagens
3. **Implementar lógica de palavras-chave** no próprio n8n
4. **Enviar respostas** via API externa

### Exemplo de Workflow Alternativo

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "whatsapp"
      }
    },
    {
      "name": "Processar Mensagem",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// Lógica de palavras-chave aqui"
      }
    },
    {
      "name": "Enviar Resposta",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.whatsapp.com/send",
        "method": "POST"
      }
    }
  ]
}
```

## 📞 Suporte

- **n8n funcionando**: ✅ Pronto para configurar workflows
- **WhatsApp API**: Escolha uma das alternativas acima
- **Documentação**: Consulte `docs/exemplos-de-uso.md`

## 🎉 Próximos Passos

1. ✅ n8n configurado e funcionando
2. 🔄 Escolher API do WhatsApp
3. 📱 Configurar webhook
4. 🤖 Importar workflow
5. 🧪 Testar bot 