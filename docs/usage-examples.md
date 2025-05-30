# Usage Examples - WhatsApp Bot

## 🎯 Practical Use Cases

### 1. Commercial Customer Service

**Configuration for store/business:**

With the current prefix system, customers need to start messages with "bot" to get AI responses:

```javascript
// Current prefix configuration in server.js
const startsWithBot = /^bot\s+/i.test(messageText);

// Example interactions:
// "bot business hours" → AI responds with business information
// "bot products" → AI shows product catalog
// "bot delivery" → AI provides delivery information
```

### 2. Medical Clinic

**Configuration for appointments and information:**

```javascript
// Example AI prompt configuration in n8n workflow:
const clinicPrompt = `You are a medical clinic assistant. Help with:
- Appointment scheduling
- Office hours
- Exam results
- Emergency information
Always be professional and caring.`;

// Patient interactions:
// "bot schedule appointment" → AI helps with scheduling
// "bot office hours" → AI provides clinic hours
// "bot emergency" → AI provides emergency contacts
```

### 3. Restaurant/Delivery

**Configuration for orders and menu:**

```javascript
// Restaurant AI configuration
const restaurantPrompt = `You are a restaurant assistant. Help customers with:
- Menu items and prices
- Delivery information
- Current promotions
- Order status
Be friendly and appetizing in descriptions.`;

// Customer interactions:
// "bot menu" → AI shows current menu
// "bot delivery" → AI provides delivery info
// "bot specials" → AI lists current promotions
```

## 📱 Conversation Examples

### Conversation 1: Customer asking about business hours

```
Customer: "bot are you open?"
AI Bot: "Hello! 👋 Welcome!

Yes, we're currently open! Here are our business hours:

🕐 **Business Hours:**
Monday to Friday: 9am - 6pm
Saturday: 9am - 1pm
Sunday: Closed

📍 Located at: 123 Flower Street

How can I help you today? 😊"

Customer: "bot what services do you offer?"
AI Bot: "Great question! Here are our main services:

🔧 **Our Services:**
• Air conditioning installation
• Maintenance and repair
• 24/7 emergency service
• Free consultations

Would you like more details about any specific service?"
```

### Conversation 2: Non-prefixed message (history only)

```
Customer: "hello there"
System: [Stores in history - no response sent]

Customer: "anyone there?"
System: [Stores in history - no response sent]

Customer: "bot hello"
AI Bot: "Hi there! 👋 I see you've been trying to reach us. 

I'm here to help! What can I assist you with today?

💡 **Tip:** Start your messages with 'bot' to get my attention faster! 😊"
```

### Conversation 3: AI handling complex questions

```
Customer: "bot I need help choosing the right air conditioner for my 20m² room"
AI Bot: "I'd be happy to help you choose the perfect air conditioner! 

For a 20m² room, here's what I recommend:

❄️ **Ideal Capacity:** 9,000-12,000 BTUs
🏠 **Room considerations:**
• Ceiling height
• Sun exposure
• Number of people
• Electronic equipment

**Our recommendations:**
• Inverter models for energy efficiency
• Split systems for better aesthetics
• Installation included in price

Would you like me to connect you with our technical team for a personalized quote? 🔧"

Customer: "bot yes, connect me with technical team"
AI Bot: "Perfect! I'm connecting you with our technical specialist now.

📞 **Escalating to human specialist...**

Someone from our technical team will contact you within 15 minutes to discuss your specific needs and provide a personalized quote.

Please keep your WhatsApp available! 📱

Is there anything else I can help you with while you wait?"
```

## 🔧 Advanced System Features

### 1. Debounce System in Action

```
Customer: "bot I need help with"
[Timer starts: 10 seconds]

Customer: "air conditioning installation"
[Timer resets: 10 seconds]

Customer: "for my office"
[Timer resets: 10 seconds]

[After 10 seconds of silence]
AI Bot: "I understand you need help with air conditioning installation for your office. 

I can help you with that! Here's what we offer for commercial installations:

🏢 **Commercial AC Services:**
• Site assessment and planning
• Professional installation
• Maintenance contracts
• Energy efficiency consulting

Would you like to schedule a site visit for a free assessment?"
```

### 2. Auto-Recovery from Bad MAC Error

```
System Log:
❌ Bad MAC error detected
🔧 Auto-clearing corrupted session...
🗑️ Removed auth_info_baileys directory
🔄 Reconnecting to WhatsApp...
📱 New QR code generated
✅ Connection restored automatically

Customer: "bot hello"
AI Bot: "Hello! I'm back online and ready to help! 😊"
```

### 3. History Context Utilization

```
Previous conversation (stored in history):
Customer: "hello"
Customer: "I'm looking for air conditioning"
Customer: "for a small apartment"

Current conversation:
Customer: "bot can you help me now?"
AI Bot: "Of course! I see from our previous conversation that you're looking for air conditioning for a small apartment.

Based on that, I can recommend:

🏠 **For Small Apartments (up to 15m²):**
• 7,000-9,000 BTU units
• Window or split options
• Energy-efficient models
• Quiet operation features

Would you like specific model recommendations or pricing information?"
```

## 📊 Real-time Monitoring Examples

### 1. Debug Endpoints Usage

```bash
# Check active conversations
curl http://localhost:3000/debug/messages
# Returns: List of all active conversations with message counts

# View specific contact history
curl http://localhost:3000/history/CustomerName
# Returns: Complete conversation history for that contact

# Monitor debounce timers
curl http://localhost:3000/debug/timers
# Returns: Active timers with visual progress bars

# System diagnostics
curl http://localhost:3000/debug/connection
# Returns: Complete system health status
```

### 2. Visual Timer Display

```
Terminal Output:
⏱️  TIMERS ATIVOS: 
Customer A: [██████░░░░] 6s | 
Customer B: [████████░░] 2s | 
Customer C: [██████████] processando...

✅ [DEBOUNCE] Timer expired for Customer A - processing message
📤 [N8N] Processing message: "bot I need help with installation"
🤖 AI Response generated and sent
```

## 🎯 Best Practices and Tips

### 1. Effective AI Prompts

```javascript
// Good prompt example
const effectivePrompt = `You are a professional customer service AI for [Company Name].

GUIDELINES:
- Always be helpful and friendly
- Provide specific, actionable information
- Ask clarifying questions when needed
- Escalate complex technical issues to humans
- Use emojis appropriately
- Keep responses concise but complete

COMPANY INFO:
- Business hours: Mon-Fri 9am-6pm
- Services: [List main services]
- Contact: [Phone/email]
- Location: [Address]

Respond to customer inquiries professionally and helpfully.`;
```

### 2. Prefix Customization

```javascript
// Default configuration
const startsWithBot = /^bot\s+/i.test(messageText);

// Alternative prefixes
const startsWithAI = /^ai\s+/i.test(messageText);
const startsWithHelp = /^help\s+/i.test(messageText);
const startsWithSupport = /^support\s+/i.test(messageText);

// Multiple prefix support
const hasPrefix = /^(bot|ai|help|support)\s+/i.test(messageText);
```

### 3. Optimization Strategies

```javascript
// Adjust timing for different use cases
// High-volume business (faster processing)
const DEBOUNCE_DELAY = 5000;  // 5 seconds
const INTERACTION_RESET = 3000;  // 3 seconds

// Consultation-based business (longer processing)
const DEBOUNCE_DELAY = 15000;  // 15 seconds
const INTERACTION_RESET = 10000;  // 10 seconds
```

## 📈 Analytics and Performance

### 1. Conversation Metrics

```javascript
// Example analytics data structure
const analytics = {
  total_conversations: 1247,
  ai_responses: 856,
  human_escalations: 391,
  most_common_prefixes: ["bot help", "bot info", "bot hours"],
  average_response_time: "2.3 seconds",
  peak_hours: ["10am-12pm", "2pm-4pm"],
  user_satisfaction: "92%"
};
```

### 2. System Performance

```bash
# Performance monitoring commands
curl http://localhost:3000/debug/store | jq .
# Shows memory usage and conversation statistics

docker stats
# Shows container resource usage

curl http://localhost:3000/debug/timers | grep -c "TIMERS ATIVOS"
# Count active debounce timers
```

## 🚀 Advanced Use Cases

### 1. Multi-Language Support

```javascript
// Language detection and response
const detectLanguage = (message) => {
  if (/^bot\s+/i.test(message)) {
    // English
    return 'en';
  } else if (/^bot\s+/i.test(message)) {
    // Portuguese  
    return 'pt';
  }
  return 'pt'; // default
};

// Localized responses
const responses = {
  en: "Hello! How can I help you today?",
  pt: "Olá! Como posso ajudá-lo hoje?"
};
```

### 2. Business Hours Integration

```javascript
// Smart business hours checking
const isBusinessHours = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday
  
  // Monday-Friday 9am-6pm
  if (day >= 1 && day <= 5 && hour >= 9 && hour < 18) {
    return true;
  }
  return false;
};

// Auto-response for off-hours
if (!isBusinessHours()) {
  response = "We're currently closed. Our business hours are Monday-Friday 9am-6pm. We'll respond to your message first thing tomorrow! 🌙";
}
```

### 3. Integration with External APIs

```javascript
// Example: Weather integration
const getWeatherInfo = async (location) => {
  // API call to weather service
  return `Current weather in ${location}: 25°C, Sunny ☀️`;
};

// Example: Stock/inventory check
const checkInventory = async (product) => {
  // API call to inventory system
  return `${product} is currently in stock! 📦`;
};
```

## 🎉 Success Stories

### Example 1: E-commerce Integration
```
Customer: "bot check availability of iPhone 14"
AI Bot: "📱 **iPhone 14 Availability:**

✅ iPhone 14 128GB - In Stock (5 units)
✅ iPhone 14 256GB - In Stock (3 units) 
❌ iPhone 14 512GB - Out of Stock

**Current Promotion:** 10% off + Free shipping

Would you like to place an order or get more details?"
```

### Example 2: Appointment Scheduling
```
Customer: "bot schedule appointment for next week"
AI Bot: "I'd be happy to help you schedule an appointment! 📅

**Available slots next week:**
• Monday: 10am, 2pm, 4pm
• Tuesday: 9am, 11am, 3pm
• Wednesday: 10am, 1pm
• Friday: 9am, 2pm, 5pm

Which day and time works best for you?"
```

**Your intelligent WhatsApp bot can handle complex business scenarios with ease! 🚀** 