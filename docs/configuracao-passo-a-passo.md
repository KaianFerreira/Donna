# Configuração Passo a Passo - Bot WhatsApp com n8n

## 🚀 Início Rápido

### 1. Preparação do Ambiente

```bash
# Clone ou baixe este projeto
cd report-spur

# Torne o script executável
chmod +x scripts/setup.sh

# Execute o setup automático
./scripts/setup.sh
```

## 📋 Configuração Detalhada

### 2. Configurar Evolution API

1. **Acesse o Evolution API**: http://localhost:8080
2. **Crie uma nova instância**:
   - Nome: `meu-bot-whatsapp`
   - Token: Use a API Key: `B6D711FCDE4D4FD5936544120E713976`

3. **Configure o Webhook**:
   ```json
   {
     "webhook": "http://localhost:5678/webhook/whatsapp",
     "events": ["messages.upsert"]
   }
   ```

4. **Conecte seu WhatsApp**:
   - Escaneie o QR Code com seu WhatsApp
   - Aguarde a conexão ser estabelecida

### 3. Configurar n8n

1. **Acesse o n8n**: http://localhost:5678
   - Usuário: `admin`
   - Senha: `admin123`

2. **Importe o Workflow**:
   - Clique em "Import from file"
   - Selecione `workflows/whatsapp-bot-main.json`
   - Clique em "Import"

3. **Configure as Credenciais**:
   - No nó "Enviar Resposta Automática", atualize:
     - URL: `http://evolution-api:8080/message/sendText/meu-bot-whatsapp`
     - API Key: `B6D711FCDE4D4FD5936544120E713976`
   
   - Repita para os outros nós de envio de mensagem

4. **Ative o Workflow**:
   - Clique no botão "Active" no canto superior direito

### 4. Personalizar Respostas

Edite o arquivo `config/keywords.json` para personalizar:

```json
{
  "keywords": {
    "horario": {
      "triggers": ["horario", "funcionamento"],
      "response": "Funcionamos de Segunda a Sexta, 8h às 18h"
    }
  },
  "escalation": {
    "contact_number": "5511999999999",
    "message": "Sua mensagem foi encaminhada para nossa equipe!"
  }
}
```

**Campos importantes para alterar**:
- `escalation.contact_number`: Seu número para receber mensagens não respondidas
- Todas as respostas automáticas
- Palavras-chave (triggers)

### 5. Testar o Bot

1. **Envie uma mensagem de teste**:
   - "oi" → Deve responder com saudação
   - "horario" → Deve responder com horário de funcionamento
   - "ajuda" → Deve mostrar menu de opções

2. **Teste a escalação**:
   - Envie uma mensagem que não corresponda a nenhuma palavra-chave
   - Você deve receber a mensagem no número configurado para escalação

## 🔧 Configurações Avançadas

### Webhook Personalizado

Se quiser usar um webhook externo (ex: ngrok):

1. **Instale o ngrok**:
   ```bash
   # Ubuntu/Debian
   sudo apt install snapd
   sudo snap install ngrok
   
   # Configure seu token (registre-se em ngrok.com)
   ngrok authtoken SEU_TOKEN_AQUI
   ```

2. **Exponha o n8n**:
   ```bash
   ngrok http 5678
   ```

3. **Atualize o webhook no Evolution API**:
   ```
   https://seu-id.ngrok.io/webhook/whatsapp
   ```

### Múltiplas Instâncias

Para gerenciar múltiplos WhatsApps:

1. Crie instâncias separadas no Evolution API
2. Duplique o workflow no n8n
3. Configure webhooks diferentes para cada instância

### Logs e Monitoramento

- **Logs do n8n**: Acesse "Executions" no painel
- **Logs do Evolution API**: `docker logs evolution-api`
- **Logs gerais**: `docker-compose logs -f`

## 🐛 Solução de Problemas

### Bot não responde

1. **Verifique se o workflow está ativo**
2. **Teste o webhook manualmente**:
   ```bash
   curl -X POST http://localhost:5678/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"test": "message"}'
   ```

3. **Verifique os logs**:
   ```bash
   docker logs n8n-whatsapp-bot
   docker logs evolution-api
   ```

### Mensagens não chegam no número de escalação

1. **Verifique o número no config/keywords.json**
2. **Confirme que o formato está correto**: `5511999999999`
3. **Teste enviando mensagem manual via Evolution API**

### QR Code não aparece

1. **Reinicie o Evolution API**:
   ```bash
   docker restart evolution-api
   ```

2. **Verifique se a instância foi criada corretamente**
3. **Acesse os logs para ver erros**

## 📞 Suporte

- **Documentação n8n**: https://docs.n8n.io/
- **Documentação Evolution API**: https://doc.evolution-api.com/
- **Issues do projeto**: Crie uma issue no repositório

## 🎯 Próximos Passos

1. **Adicione mais palavras-chave** conforme sua necessidade
2. **Configure respostas mais elaboradas** com botões e mídia
3. **Implemente integração com CRM** ou banco de dados
4. **Configure backup automático** das conversas
5. **Adicione analytics** para monitorar performance 