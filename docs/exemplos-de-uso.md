# Exemplos de Uso - Bot WhatsApp

## 🎯 Casos de Uso Práticos

### 1. Atendimento Comercial

**Configuração para loja/empresa:**

```json
{
  "keywords": {
    "horario": {
      "triggers": ["horario", "funcionamento", "aberto", "fechado"],
      "response": "🕐 **Horário de Funcionamento:**\n\nSegunda a Sexta: 9h às 18h\nSábado: 9h às 13h\nDomingo: Fechado\n\n📍 Estamos localizados na Rua das Flores, 123"
    },
    "produtos": {
      "triggers": ["produtos", "catalogo", "catálogo", "o que vendem"],
      "response": "🛍️ **Nossos Produtos:**\n\n• Roupas Femininas\n• Roupas Masculinas\n• Acessórios\n• Calçados\n\nPara ver nosso catálogo completo: www.loja.com/catalogo"
    },
    "entrega": {
      "triggers": ["entrega", "frete", "envio", "correios"],
      "response": "🚚 **Informações de Entrega:**\n\n• Entrega grátis acima de R$ 100\n• Prazo: 3-5 dias úteis\n• Regiões atendidas: Todo Brasil\n\nCalcule o frete em: www.loja.com/frete"
    }
  }
}
```

### 2. Consultório Médico

**Configuração para agendamentos:**

```json
{
  "keywords": {
    "agendamento": {
      "triggers": ["agendar", "consulta", "marcar", "horario"],
      "response": "📅 **Agendamento de Consultas:**\n\nPara agendar sua consulta:\n📞 (11) 3333-3333\n💻 www.clinica.com/agendamento\n\n⏰ Horários disponíveis:\nSegunda a Sexta: 8h às 17h"
    },
    "exames": {
      "triggers": ["exames", "resultado", "laboratorio"],
      "response": "🔬 **Resultados de Exames:**\n\nAcesse seus resultados em:\n💻 www.clinica.com/resultados\n\nOu retire pessoalmente:\nSegunda a Sexta: 8h às 16h"
    },
    "emergencia": {
      "triggers": ["urgente", "emergencia", "emergência", "socorro"],
      "response": "🚨 **EMERGÊNCIA:**\n\nEm caso de emergência, ligue:\n📞 192 (SAMU)\n📞 193 (Bombeiros)\n\nOu dirija-se ao hospital mais próximo!"
    }
  }
}
```

### 3. Restaurante/Delivery

**Configuração para pedidos:**

```json
{
  "keywords": {
    "cardapio": {
      "triggers": ["cardapio", "cardápio", "menu", "pratos"],
      "response": "🍽️ **Nosso Cardápio:**\n\n🍕 Pizzas: R$ 25-45\n🍔 Hambúrgueres: R$ 15-25\n🥗 Saladas: R$ 12-18\n🍰 Sobremesas: R$ 8-12\n\nVeja o cardápio completo: www.restaurante.com/menu"
    },
    "delivery": {
      "triggers": ["delivery", "entrega", "pedir", "pedido"],
      "response": "🛵 **Delivery:**\n\nFaça seu pedido:\n📱 App: RestauranteApp\n💻 www.restaurante.com/pedido\n📞 (11) 4444-4444\n\n⏰ Tempo de entrega: 30-45min\n🚚 Taxa de entrega: R$ 5,00"
    },
    "promocoes": {
      "triggers": ["promoção", "promocao", "desconto", "oferta"],
      "response": "🎉 **Promoções Ativas:**\n\n• Pizza Grande + Refrigerante: R$ 35\n• Combo Hambúrguer: R$ 20\n• Terça-feira: 20% off em saladas\n\nVálido até o final do mês!"
    }
  }
}
```

## 📱 Exemplos de Conversas

### Conversa 1: Cliente perguntando horário

```
Cliente: "Oi, vocês estão abertos?"
Bot: "Olá! 👋 Seja bem-vindo(a)!

Sou o assistente virtual e estou aqui para te ajudar.

Digite *ajuda* para ver as opções ou me conte como posso te auxiliar! 😊"

Cliente: "horario"
Bot: "🕐 **Horário de Funcionamento:**

Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h
Domingo: Fechado

Estamos sempre prontos para te atender! 😊"
```

### Conversa 2: Pergunta não reconhecida

```
Cliente: "Vocês fazem instalação de ar condicionado?"
Bot: "🔄 **Escalando para atendimento humano...**

Sua pergunta foi encaminhada para nossa equipe. Em breve alguém entrará em contato!

Obrigado pela paciência! 🙏"

[Mensagem enviada para o número de escalação]:
"🚨 **Nova mensagem para análise:**

De: 5511987654321@s.whatsapp.net
Mensagem: Vocês fazem instalação de ar condicionado?

Por favor, responda diretamente ao cliente."
```

### Conversa 3: Solicitando ajuda

```
Cliente: "ajuda"
Bot: "🤖 **Como posso te ajudar?**

Digite uma das opções:
• *Horário* - Horário de funcionamento
• *Preços* - Tabela de valores
• *Localização* - Nosso endereço
• *Contato* - Informações de contato

Ou me conte o que você precisa! 😊"
```

## 🔧 Personalizações Avançadas

### 1. Respostas com Botões (WhatsApp Business)

```json
{
  "response": {
    "text": "Escolha uma opção:",
    "buttons": [
      {"id": "horario", "title": "Horário"},
      {"id": "precos", "title": "Preços"},
      {"id": "contato", "title": "Contato"}
    ]
  }
}
```

### 2. Respostas com Imagens

```json
{
  "response": {
    "type": "image",
    "image": "https://exemplo.com/cardapio.jpg",
    "caption": "Nosso cardápio completo! 🍽️"
  }
}
```

### 3. Respostas com Localização

```json
{
  "response": {
    "type": "location",
    "latitude": -23.550520,
    "longitude": -46.633308,
    "name": "Nossa Loja",
    "address": "Rua das Flores, 123 - São Paulo"
  }
}
```

## 📊 Métricas e Analytics

### Dados que você pode coletar:

1. **Mensagens mais frequentes**
2. **Horários de maior movimento**
3. **Palavras-chave mais usadas**
4. **Taxa de escalação para humanos**
5. **Tempo de resposta**

### Implementação básica no n8n:

```javascript
// No nó de processamento, adicione:
const analytics = {
  timestamp: new Date(),
  message: message,
  keyword_found: keywordMatch ? keywordMatch.category : null,
  escalated: !keywordMatch,
  user: fromNumber
};

// Salvar em banco de dados ou arquivo
```

## 🎯 Dicas de Otimização

### 1. Palavras-chave Inteligentes

- Use sinônimos e variações
- Inclua erros de digitação comuns
- Considere gírias regionais

### 2. Respostas Eficazes

- Seja claro e objetivo
- Use emojis para tornar mais amigável
- Inclua call-to-actions
- Forneça informações completas

### 3. Escalação Inteligente

- Configure horários para escalação
- Defina prioridades por palavra-chave
- Implemente sistema de tickets

### 4. Monitoramento

- Configure alertas para falhas
- Monitore taxa de escalação
- Analise feedback dos clientes

## 🚀 Próximos Passos

1. **Integração com CRM**: Conecte com Pipedrive, HubSpot, etc.
2. **IA Avançada**: Use OpenAI GPT para respostas mais inteligentes
3. **Multi-idiomas**: Suporte para português, inglês, espanhol
4. **Agendamento**: Integre com Google Calendar
5. **Pagamentos**: Conecte com Stripe, PagSeguro
6. **Analytics**: Dashboard com métricas detalhadas 