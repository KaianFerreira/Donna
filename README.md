# 🤖 WhatsApp Bot with Baileys + n8n + AI

## 🎯 Overview

Intelligent WhatsApp bot that integrates **Baileys** (WhatsApp connection), **n8n** (automation), and **AI** (DeepSeek/OpenAI) for natural conversations with complete history and prefix system.

## ✨ Features

- 🤖 **AI Responses**: Intelligent context based on history
- 🔑 **Prefix System**: Only responds when called with "bot"
- 📚 **Complete History**: Maintains conversation context
- ⏱️ **Debounce System**: Groups sequential messages
- 🔄 **Auto-recovery**: Automatically fixes "Bad MAC" errors
- 🐳 **Docker**: Containerized n8n for easy deployment

## 🚀 Quick Start

### 1. **Start the System**
```bash
./start.sh
```

### 2. **Check Status**
```bash
./status.sh
```

### 3. **Stop the System**
```bash
./stop.sh
```

## 📱 How to Use

### Messages that Activate the Bot:
```
bot hello, how are you?
bot help me with a project
BOT what's the weather today?
```

### Messages that DON'T Activate the Bot:
```
hello, how are you?
help me with a project
hi Kaian!
```

## 🔧 Configuration

### 1. **Configure n8n**
1. Access: http://localhost:5678
2. Login: `admin` / `admin123`
3. Import project workflow
4. Configure AI API key
5. Activate the workflow

### 2. **Connect WhatsApp**
1. QR Code will appear in terminal
2. Scan with WhatsApp
3. Bot will go online

### 3. **Configure AI (Optional)**
- DeepSeek: https://platform.deepseek.com/
- OpenAI: https://platform.openai.com/

## 🛠️ Debug Endpoints

| Endpoint | Description |
|----------|-------------|
| `http://localhost:3000/status` | Connection status |
| `http://localhost:3000/debug/connection` | Complete diagnostics |
| `http://localhost:3000/debug/messages` | View all messages |
| `http://localhost:3000/debug/timers` | View debounce timers |
| `http://localhost:3000/history/:contact` | Specific history |

## 🔄 Prefix System

### How it Works:
1. **WITH "bot" prefix**: Processes AI and responds
2. **WITHOUT prefix**: Only stores in history

### Flow:
```
"bot how are you?" → AI processes → Responds
"hi, how are you?" → History only → No response
```

## ⏱️ Debounce System

- **Delay**: 10 seconds to process
- **Reset**: 8 seconds if new message arrives
- **Visual Counter**: Shows active timers in real-time

## 🚨 Automatic Error Correction

### "Bad MAC" Error:
1. **Detects** automatically
2. **Cleans** corrupted session
3. **Reconnects** automatically
4. **Maximum** of 3 attempts

### Manual Correction:
```bash
# Via NPM
npm run fix-badmac

# Via API
curl -X POST http://localhost:3000/debug/clear-session

# Manual
rm -rf whatsapp-baileys/auth_info_baileys
./start.sh
```

## 🏗️ Architecture

```
WhatsApp ←→ Baileys ←→ n8n ←→ AI ←→ Response
              ↓
         Local History
```

### Components:
- **Baileys**: WhatsApp Web connection
- **n8n**: Orchestration and workflows
- **AI**: Natural language processing
- **Docker**: n8n containerization

## 📊 Monitoring

### Available Logs:
- ✅ Successful connections
- 🤖 Prefix verification
- ⏱️ Debounce timers
- 🚨 Errors and automatic corrections
- 📤 Sends to AI/n8n

### Metrics:
```bash
# View active conversations
curl http://localhost:3000/debug/store

# View active timers
curl http://localhost:3000/debug/timers

# Complete diagnostics
curl http://localhost:3000/debug/connection
```

## 🛡️ Troubleshooting

### Problem: Bot doesn't respond
**Solution**: Check if message has "bot" prefix

### Problem: "Bad MAC" error
**Solution**: System corrects automatically

### Problem: n8n doesn't start
**Solution**: 
```bash
docker compose -f docker-compose.simple.yml down
./start.sh
```

### Problem: WhatsApp disconnects
**Solution**:
```bash
curl -X POST http://localhost:3000/debug/reconnect
```

## 📋 Available Scripts

### In Project:
- `./start.sh` - Start everything
- `./status.sh` - Check status
- `./stop.sh` - Stop everything

### In Baileys:
- `npm run clear-session` - Clear WhatsApp session
- `npm run fix-badmac` - Fix Bad MAC error

## 🔧 Customization

### Change Bot Prefix:
In `server.js` file, find and change:
```javascript
const startsWithBot = /^bot\s+/i.test(messageText);
```

To:
```javascript
const startsWithBot = /^ai\s+/i.test(messageText);
```

### Adjust Debounce Timing:
```javascript
const DEBOUNCE_DELAY = 10000; // 10 seconds
const INTERACTION_RESET = 8000; // 8 seconds
```

## 📄 Project Structure

```
report-spur/
├── whatsapp-baileys/
│   ├── server.js           # Main server
│   ├── clear-session.js    # Cleanup script
│   └── package.json        # Dependencies
├── start.sh               # Start system
├── status.sh              # Check status
├── stop.sh                # Stop system
├── docker-compose.simple.yml
└── README.md              # This file
```

## 🎯 Current Status

- ✅ **WhatsApp connected** and working
- ✅ **Prefix system** implemented
- ✅ **History** operational with 180+ conversations
- ✅ **Debounce system** active
- ✅ **Auto-correction** of errors working
- ✅ **n8n** running in Docker
- ✅ **Debug endpoints** available

## 🚀 Next Steps

1. **Test the system** by sending messages with "bot" prefix
2. **Configure AI** in n8n workflow
3. **Monitor logs** to track functionality
4. **Customize** according to your needs

---

**🎉 Fully functional and self-recovering system!**

For support, check real-time logs or use debug endpoints. 