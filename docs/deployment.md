# 🚀 Deployment Guide

## Cloud Deployment Options

### Railway (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link project
railway link

# Deploy
railway up
```

### Manual Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Start the server: `npm start`

## Environment Setup

### Required Environment Variables
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_API_KEY_SID=your_api_key_sid
TWILIO_API_KEY_SECRET=your_api_key_secret
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Google Cloud Configuration
GOOGLE_API_KEY=your_google_api_key
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_service_account_private_key

# Pusher Configuration (for real-time updates)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster

# Client-side Pusher Configuration
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=wss://your-domain.com
```

## External Service Setup

### 1. Twilio Configuration
- Create a Twilio account and purchase a phone number
- Set up a Twilio API key and secret (preferred over auth token)
- Configure your Twilio phone number to use webhooks:
  - Voice webhook (HTTP POST): `https://your-domain.com/api/incoming-call`
- Set up Media Streams:
  - Enable "Process audio with WebSocket"
  - WebSocket URL: `wss://your-domain.com/api/audio-stream`
  - Audio Track: `inbound_track`
  - Audio Format: MULAW, 8000Hz

### 2. Google Cloud Setup
- Create a Google Cloud project
- Enable required APIs:
  - Gemini API
  - Cloud Speech-to-Text API
  - Cloud Text-to-Speech API
- Create a service account with necessary permissions
- Download service account key
- Configure Speech-to-Text settings:
  - Enable streaming recognition
  - Set up phone call model
  - Configure enhanced models

### 3. Pusher Configuration
- Create a Pusher Channels account and app
- Configure your app to use private channels
- Enable client events for real-time updates
- Note your app ID, key, secret, and cluster
- Set up WebSocket connection limits appropriately

## WebSocket Configuration

### 1. SSL Setup for WebSocket
```bash
# Install SSL certificate for WSS (required for production)
certbot certonly --nginx -d your-domain.com

# Configure Nginx for WebSocket proxy
```

Example Nginx configuration:
```nginx
location /api/audio-stream {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### 2. WebSocket Health Checks
```bash
# Monitor WebSocket connections
pm2 monit

# Check WebSocket logs
tail -f ~/.pm2/logs/phoney-out.log
```

## Monitoring and Debugging

### 1. Railway Monitoring
- Use Railway's built-in logs and metrics
- Set up deployment notifications
- Monitor resource usage
- Track WebSocket connections

### 2. Real-time Audio Streaming
- Monitor WebSocket connection status
- Check audio stream quality
- Track speech recognition accuracy
- Monitor stream latency

### 3. Speech Recognition Monitoring
- View real-time transcription accuracy
- Monitor API usage and quotas
- Track recognition latency
- Analyze recognition errors

## Performance Optimization

### 1. WebSocket Performance
- Implement connection pooling
- Monitor connection lifecycle
- Handle reconnection gracefully
- Optimize packet size

### 2. Speech Recognition
- Use enhanced models for better accuracy
- Implement proper error handling
- Cache frequently used phrases
- Monitor and adjust timeouts

### 3. Resource Management
- Monitor memory usage
- Implement proper cleanup
- Handle concurrent connections
- Scale horizontally if needed

## Security Considerations

### 1. WebSocket Security
- Implement proper authentication
- Validate connection parameters
- Rate limit connections
- Monitor for abuse

### 2. Audio Data Security
- Implement end-to-end encryption
- Handle data retention properly
- Secure audio storage
- Comply with privacy regulations

## Testing and Maintenance

### 1. Testing WebSocket Connections
```bash
# Test WebSocket connection
wscat -c wss://your-domain.com/api/audio-stream

# Monitor connection status
curl https://your-domain.com/api/health
```

### 2. Testing Speech Recognition
```bash
# Test audio streaming
curl -F "audio=@test.wav" https://your-domain.com/api/test-recognition

# Monitor recognition quality
tail -f ~/.pm2/logs/phoney-err.log
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Issues**
   - Check SSL certificate validity
   - Verify proxy configuration
   - Monitor connection timeouts
   - Check client-side errors

2. **Audio Streaming Problems**
   - Verify audio format settings
   - Check stream continuity
   - Monitor packet loss
   - Verify audio quality

3. **Speech Recognition Issues**
   - Check API quotas
   - Verify audio format
   - Monitor recognition accuracy
   - Review error patterns

### Logging and Debugging

```bash
# View WebSocket logs
pm2 logs audio-stream

# Monitor real-time metrics
pm2 monit

# Check system resources
htop

# View application errors
tail -f ~/.pm2/logs/phoney-err.log
```

## Health Checks

Regular health checks should monitor:
- WebSocket connection status
- Speech recognition accuracy
- AI response latency
- Audio stream quality
- System resource usage

## Scaling Considerations

- Implement horizontal scaling for WebSocket connections
- Use load balancing for audio processing
- Scale speech recognition workers as needed
- Monitor and adjust resource allocation
- Implement proper connection pooling
