# Step-by-Step Setup - WhatsApp Bot with n8n

## 🚀 Quick Start

### 1. Environment Preparation

```bash
# Clone or download this project
cd report-spur

# Make scripts executable
chmod +x *.sh

# Run automated setup (includes Node.js v22.12.0)
./setup-node.sh

# Start complete system
./start.sh
```

## 📋 Detailed Configuration

### 2. Configure Node.js Environment

```bash
# First time setup (automatic Node.js v22.12.0 installation)
./setup-node.sh

# Verify installation
node --version  # Should show v22.12.0
nvm version default  # Should show v22.12.0
```

### 3. Configure Baileys WhatsApp Connection

1. **Start the system** (automatically shows QR code):
   ```bash
   ./start.sh
   ```

2. **Connect your WhatsApp**:
   - Open WhatsApp on your phone
   - Go to: Menu (3 dots) → Linked devices
   - Click: "Link a device"
   - Scan the QR code that appears in terminal

3. **Wait for connection**:
   ```
   ✅ Connected to WhatsApp!
   🤖 Bot ready to receive messages
   📊 Loaded conversations from history
   ```

### 4. Configure n8n

1. **Access n8n**: http://localhost:5678
   - User: `admin`
   - Password: `admin123`

2. **Import the Workflow**:
   - Click "Import from file"
   - Select `workflows/main.json`
   - Click "Import"

3. **Configure AI Integration** (Optional):
   - Open the DeepSeek AI node
   - Add your API key from https://platform.deepseek.com/
   - Save and test

4. **Activate the Workflow**:
   - Click the "Active" button in the top right corner
   - Workflow should turn green

### 5. Customize Bot Behavior

#### Configure Keywords and Responses

The bot uses a prefix system. Edit `whatsapp-baileys/server.js` to customize:

```javascript
// Current configuration - only responds to messages starting with "bot"
const startsWithBot = /^bot\s+/i.test(messageText);

// Change prefix example:
const startsWithBot = /^ai\s+/i.test(messageText);
```

#### Adjust Timing Settings

```javascript
// In server.js - modify these values:
const DEBOUNCE_DELAY = 10000;      // Time to wait before processing (10 seconds)
const INTERACTION_RESET = 8000;    // Reset timer if new message arrives (8 seconds)
```

### 6. Test the Bot

1. **Send test messages**:
   - "bot hello" → Should respond with AI greeting
   - "bot help" → Should show available commands
   - "bot what time is it" → Should respond with current time
   - "hello" (without "bot") → Should only store in history (no response)

2. **Test via API**:
   ```bash
   # Test message sending
   curl -X POST http://localhost:3000/send \
     -H "Content-Type: application/json" \
     -d '{
       "to": "YOUR_NUMBER@s.whatsapp.net",
       "message": "Test message from bot!"
     }'
   ```

3. **Test webhook manually**:
   ```bash
   curl -X POST http://localhost:5678/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{
       "from": "5511999999999@s.whatsapp.net",
       "message": "bot hello",
       "messageId": "test123",
       "history": []
     }'
   ```

## 🔧 Advanced Configuration

### Debug and Monitoring

```bash
# Check system status
curl http://localhost:3000/debug/connection

# View conversation history
curl http://localhost:3000/debug/messages

# View active debounce timers
curl http://localhost:3000/debug/timers

# View specific contact history
curl http://localhost:3000/history/CONTACT_NAME
```

### External Webhook Setup

If you want to use external webhooks (e.g., ngrok):

1. **Install ngrok**:
   ```bash
   # Ubuntu/Debian
   sudo snap install ngrok
   
   # Configure your token (register at ngrok.com)
   ngrok authtoken YOUR_TOKEN_HERE
   ```

2. **Expose n8n**:
   ```bash
   ngrok http 5678
   ```

3. **Update webhook URL**:
   - Use the ngrok URL in external integrations
   - Format: `https://your-id.ngrok.io/webhook/whatsapp`

### Multiple Environment Setup

```bash
# Development environment
export NODE_ENV=development
./start.sh

# Production environment
export NODE_ENV=production
docker compose up -d
```

### Data Backup Configuration

```bash
# Backup WhatsApp session
cp -r whatsapp-baileys/auth_info_baileys /backup/session-$(date +%Y%m%d)

# Backup n8n workflows
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n-backup-$(date +%Y%m%d).tar.gz -C /data .

# Automated backup script
echo "0 2 * * * cd /path/to/project && ./backup.sh" | crontab -
```

## 🐛 Troubleshooting

### Bot doesn't respond

1. **Check if message has "bot" prefix**
2. **Verify workflow is active**:
   ```bash
   curl http://localhost:5678/healthz
   ```
3. **Check logs**:
   ```bash
   # System will show logs automatically when using ./start.sh
   # Or check specific components:
   docker compose -f docker-compose.simple.yml logs n8n
   ```

### Bad MAC Error (Auto-Recovery)

The system automatically handles this error, but you can manually trigger recovery:

```bash
# Clear corrupted session
curl -X POST http://localhost:3000/debug/clear-session

# Or restart system
./stop.sh
./start.sh
```

### Wrong Node.js Version

```bash
# Reset Node.js version
./setup-node.sh

# Or manually
nvm use 22.12.0
nvm alias default 22.12.0
```

### WhatsApp Connection Issues

```bash
# Force reconnection
curl -X POST http://localhost:3000/debug/reconnect

# Check connection status
curl http://localhost:3000/debug/connection
```

### n8n Workflow Issues

1. **Verify workflow is imported and active**
2. **Check webhook URL**: `http://localhost:5678/webhook/whatsapp`
3. **Test webhook manually** (see test commands above)
4. **Restart n8n if needed**:
   ```bash
   docker compose -f docker-compose.simple.yml restart n8n
   ```

## 📊 Monitoring and Logs

### Real-time Monitoring

```bash
# Start system with real-time logs
./start.sh  # Shows all logs in terminal

# Background monitoring
tail -f logs/system.log  # If configured for background logging
```

### Performance Metrics

```bash
# Check container resource usage
docker stats

# Check Baileys performance
curl http://localhost:3000/debug/store

# View conversation statistics
curl http://localhost:3000/debug/messages | jq '.conversationCount'
```

### Log Analysis

```bash
# View system events
grep "Connected\|Error\|Timer" logs/system.log

# Monitor AI responses
grep "AI Response\|DeepSeek" logs/system.log

# Track prefix usage
grep "Prefix check" logs/system.log
```

## 📞 Support and Resources

### Documentation
- **Main README**: Complete system overview
- **API Reference**: All endpoints documented
- **Usage Examples**: See `docs/usage-examples.md`

### External Resources
- **n8n Documentation**: https://docs.n8n.io/
- **Baileys Documentation**: https://github.com/WhiskeySockets/Baileys
- **DeepSeek API**: https://platform.deepseek.com/docs

### Community Support
- **Issues**: Create issues in the project repository
- **Discussions**: Use GitHub discussions for questions
- **Updates**: Check for system updates regularly

## 🎯 Next Steps

1. **Configure AI integration** with your preferred provider
2. **Customize bot responses** for your specific use case
3. **Set up monitoring** and alerting for production use
4. **Implement backup strategy** for important conversations
5. **Scale horizontally** with multiple instances if needed
6. **Add analytics** to track bot performance
7. **Integrate with external APIs** for enhanced functionality

## 🎉 Completion Checklist

- [ ] Node.js v22.12.0 installed and configured
- [ ] WhatsApp connected via QR code scan
- [ ] n8n workflow imported and activated
- [ ] AI integration configured (optional)
- [ ] Bot responding to "bot" prefixed messages
- [ ] Prefix system working correctly
- [ ] Auto-recovery mechanisms tested
- [ ] Debug endpoints accessible
- [ ] System monitoring active
- [ ] Backup strategy implemented

**Your intelligent WhatsApp bot is fully operational and ready for production use! 🚀** 