# Manual Configuration - WhatsApp Bot

## 🎯 Current Status

✅ **n8n working**: http://localhost:5678 (admin/admin123)
✅ **Baileys configured**: Direct WhatsApp Web connection
✅ **Auto-recovery active**: Bad MAC error handling
✅ **Node.js v22.12.0**: Version management working

## 🚀 Current Working Configuration

### n8n Active
```bash
# Current container working:
docker ps | grep n8n
# Should show: n8n container running on port 5678
```

**Access**: http://localhost:5678
- **User**: admin
- **Password**: admin123

### Baileys Integration
```bash
# Check Baileys status:
curl http://localhost:3000/status
# Should return: {"status":"connected","timestamp":"..."}
```

## 📋 Setup Steps

### 1. Configure n8n

1. **Access**: http://localhost:5678
2. **Login** with admin/admin123
3. **Import the workflow**:
   - Click "+" → "Import from file"
   - Select: `workflows/main.json`
   - Click "Import"
4. **Activate workflow**: Toggle the switch to green

### 2. Configure AI Integration (Optional)

#### DeepSeek AI Setup
1. **Create account**: https://platform.deepseek.com/
2. **Get API key** from dashboard
3. **In n8n workflow**:
   - Open the DeepSeek AI node
   - Add your API key
   - Save and test

#### Alternative: OpenAI
1. **Get API key**: https://platform.openai.com/
2. **Replace DeepSeek node** with OpenAI node
3. **Configure** with your key

### 3. Configure WhatsApp Connection

#### Current Setup: Baileys (Recommended)
```bash
# Start the complete system:
./start.sh

# System will:
# 1. Setup Node.js v22.12.0
# 2. Start n8n container
# 3. Start Baileys server
# 4. Show QR code for WhatsApp connection
```

#### Alternative: WhatsApp Business API
```bash
# For production use:
# - Meta WhatsApp Business API
# - Twilio WhatsApp API
# - Official WhatsApp Cloud API
```

### 4. Configure Webhook in n8n

**Webhook URL**: `http://localhost:5678/webhook/whatsapp`

The workflow is pre-configured to:
1. Receive messages from Baileys
2. Check for "bot" prefix
3. Process with AI if prefixed
4. Send response back through Baileys

### 5. Test the Bot

#### Manual Test
```bash
# Send message with "bot" prefix to your WhatsApp
# Examples:
# "bot hello" → Should get AI response
# "bot help" → Should show available commands
# "hello" → Should be stored in history (no response)
```

#### API Test
```bash
# Test webhook manually:
curl -X POST http://localhost:5678/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "from": "5511999999999@s.whatsapp.net",
    "message": "bot hello",
    "messageId": "test123",
    "history": []
  }'
```

#### Debug Endpoints
```bash
# Check system status
curl http://localhost:3000/debug/connection

# View conversation history
curl http://localhost:3000/debug/messages

# View active debounce timers
curl http://localhost:3000/debug/timers
```

## 🔧 System Management

### Container Management
```bash
# View running containers
docker ps

# View n8n logs
docker compose -f docker-compose.simple.yml logs n8n

# Restart n8n
docker compose -f docker-compose.simple.yml restart n8n

# Stop everything
./stop.sh
```

### Node.js Management
```bash
# First time setup
./setup-node.sh

# Check current version
node --version  # Should show v22.12.0

# Use project version
nvm use
```

### Baileys Management
```bash
# Check if running
curl http://localhost:3000/status

# View complete diagnostics
curl http://localhost:3000/debug/connection

# Clear session (if Bad MAC error)
curl -X POST http://localhost:3000/debug/clear-session

# Force reconnection
curl -X POST http://localhost:3000/debug/reconnect
```

### Data Backup
```bash
# Backup n8n data
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n-backup.tar.gz -C /data .

# Restore backup
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar xzf /backup/n8n-backup.tar.gz -C /data

# Backup WhatsApp session
cp -r whatsapp-baileys/auth_info_baileys /backup/whatsapp-session
```

## 🎯 Advanced Configuration

### Customizing Bot Behavior

#### Change Bot Prefix
Edit `whatsapp-baileys/server.js`:
```javascript
// Change from "bot" to your preferred prefix
const startsWithBot = /^ai\s+/i.test(messageText);
```

#### Adjust Debounce Timing
```javascript
const DEBOUNCE_DELAY = 15000;  // 15 seconds instead of 10
const INTERACTION_RESET = 10000;  // 10 seconds instead of 8
```

### Multiple Environment Setup
```bash
# Development
export NODE_ENV=development
./start.sh

# Production
export NODE_ENV=production
docker compose -f docker-compose.yml up -d
```

## 🔍 Monitoring & Logs

### Real-time Monitoring
```bash
# View all system logs
./start.sh  # Logs appear in terminal

# Background monitoring
tail -f logs/system.log  # If running in background
```

### Performance Metrics
```bash
# Check memory usage
docker stats n8n

# Check Baileys performance
curl http://localhost:3000/debug/store
```

## 📞 Support & Troubleshooting

### Common Issues

#### Problem: Bot doesn't respond
**Solution**: Check if message starts with "bot" prefix

#### Problem: Bad MAC error
**Solution**: System auto-recovers, or manually clear session:
```bash
curl -X POST http://localhost:3000/debug/clear-session
```

#### Problem: Wrong Node.js version
**Solution**: 
```bash
./setup-node.sh  # First time
nvm use          # Regular use
```

#### Problem: n8n workflow not active
**Solution**: 
1. Access http://localhost:5678
2. Check workflow toggle is green
3. Test webhook connection

### Support Resources
- **Documentation**: Check `docs/` folder
- **API Reference**: All endpoints in README.md
- **Examples**: See `docs/usage-examples.md`

## 🎉 Complete Setup Checklist

1. ✅ Node.js v22.12.0 configured
2. ✅ n8n container running
3. ✅ Baileys server active
4. ✅ WhatsApp connected via QR code
5. ✅ Workflow imported and activated
6. ✅ AI integration configured (optional)
7. ✅ Prefix system working
8. ✅ Auto-recovery mechanisms active
9. ✅ Debug endpoints available
10. ✅ System monitoring active

**Your intelligent WhatsApp bot is fully operational! 🚀** 