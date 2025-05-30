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
- 🔧 **Node.js Management**: Fixed version with nvm for consistency

## 🚀 Quick Start

### 1. **Setup Node.js (First Time)**
```bash
./setup-node.sh  # Configures Node.js v22.14 automatically
```

### 2. **Start the System**
```bash
./start.sh       # Automatically uses correct Node.js version
```

### 3. **Check Status**
```bash
./status.sh
```

### 4. **Stop the System**
```bash
./stop.sh
```

## 🔧 Node.js Version Management

This project uses **Node.js v22.14** consistently across all environments for maximum stability and compatibility.

### 📁 Configuration Files

#### `.nvmrc`
```
22.14
```
Specifies the exact Node.js version for this project.

#### `package.json`
```json
{
  "engines": {
    "node": "22.14",
    "npm": ">=8.0.0"
  }
}
```

### 🚀 Setup Methods

#### 1. **Automatic Setup (Recommended)**
```bash
./setup-node.sh
```

#### 2. **Manual Setup**
```bash
# Install nvm (if not installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install and use specified version
nvm install 22.14
nvm use 22.14
nvm alias default 22.14
```

#### 3. **Project Usage**
```bash
# start.sh automatically configures Node.js
./start.sh

# Or manually when needed
nvm use
```

### ✅ Verification

```bash
# Check active version
node --version  # Should return v22.14

# Check nvm default
nvm version default  # Should return v22.14
```

### 🔄 NPM Scripts

```bash
npm run setup-node  # Configure Node.js version
npm run start        # Start bot (with automatic configuration)
npm run status       # Check service status
npm run stop         # Stop all services
```

### ⚠️ Troubleshooting

#### Problem: `nvm: command not found`
**Solution:**
```bash
# Reload bash configurations
source ~/.bashrc
source ~/.bash_profile
```

#### Problem: Wrong Node.js version
**Solution:**
```bash
# Use project version
nvm use

# Or set as default
nvm alias default 22.14
```

#### Problem: Incompatible `package-lock.json`
**Solution:**
```bash
# Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### 🎯 Why v22.14?

- ✅ **Stable**: Tested LTS version
- ✅ **Performance**: Optimizations for Node.js applications
- ✅ **Compatibility**: Works well with Baileys and n8n
- ✅ **Security**: Version with security fixes
- ✅ **Consistency**: Same version in development and production

### 📋 Configuration Checklist

- [ ] nvm installed and configured
- [ ] Node.js v22.14 installed
- [ ] Default version set
- [ ] `.nvmrc` present in project
- [ ] `start.sh` configured to use nvm
- [ ] Dependencies installed with correct version

### Automatic Configuration:
The `start.sh` script automatically:
1. Loads nvm if available
2. Installs Node.js v22.14 if needed
3. Switches to the correct version
4. Verifies the installation

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
- **nvm**: Node.js version management

## 📊 Monitoring

### Available Logs:
- ✅ Successful connections
- 🤖 Prefix verification
- ⏱️ Debounce timers
- 🚨 Errors and automatic corrections
- 📤 Sends to AI/n8n
- 🔧 Node.js version info

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

### Problem: Wrong Node.js version
**Solution**: 
```bash
./setup-node.sh  # Or manually: nvm use
```

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
- `./setup-node.sh` - Configure Node.js version
- `./start.sh` - Start everything (with Node.js check)
- `./status.sh` - Check status
- `./stop.sh` - Stop everything

### NPM Scripts:
- `npm run setup-node` - Configure Node.js version
- `npm run start` - Start system
- `npm run status` - Check status
- `npm run stop` - Stop system

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
├── .nvmrc                     # Node.js version specification
├── setup-node.sh             # Node.js setup script
├── whatsapp-baileys/
│   ├── server.js              # Main server
│   ├── clear-session.js       # Cleanup script
│   └── package.json           # Dependencies
├── start.sh                   # Start system (with Node.js setup)
├── status.sh                  # Check status
├── stop.sh                    # Stop system
├── docker-compose.simple.yml
├── docs/                      # Project documentation
│   ├── baileys-manual-setup.md
│   ├── manual-configuration.md
│   ├── step-by-step-setup.md
│   ├── usage-examples.md
│   └── personal-whatsapp.md
└── README.md                  # This file
```

## 🎯 Current Status

- ✅ **Node.js v22.14** configured and locked
- ✅ **WhatsApp connected** and working
- ✅ **Prefix system** implemented
- ✅ **History** operational with 180+ conversations
- ✅ **Debounce system** active
- ✅ **Auto-correction** of errors working
- ✅ **n8n** running in Docker
- ✅ **Debug endpoints** available

## 🚀 Next Steps

1. **Setup Node.js** with `./setup-node.sh` (first time only)
2. **Test the system** by sending messages with "bot" prefix
3. **Configure AI** in n8n workflow
4. **Monitor logs** to track functionality
5. **Customize** according to your needs

---

**🎉 Fully functional and self-recovering system with consistent Node.js environment!**

For support, check real-time logs or use debug endpoints.

💡 **Tip:** The system is configured to automatically ensure the correct version is used. Just run `./start.sh` and everything will be configured automatically! 