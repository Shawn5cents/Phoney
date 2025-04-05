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

# Google AI Configuration
GOOGLE_API_KEY=your_google_api_key

# Pusher Configuration (for real-time updates)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster

# Client-side Pusher Configuration
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
```

## External Service Setup

### 1. Twilio Configuration
- Create a Twilio account and purchase a phone number
- Set up a Twilio API key and secret (preferred over auth token)
- Configure your Twilio phone number to use webhooks:
  - Voice webhook (HTTP POST): `https://your-domain.com/api/incoming-call`

### 2. Pusher Configuration
- Create a Pusher Channels account and app
- Configure your app to use private channels
- Enable client events if you need them
- Note your app ID, key, secret, and cluster

### 3. Google API Setup
- Create a Google Cloud project
- Enable the Gemini API and get an API key
- Enable the Cloud Text-to-Speech API

## Monitoring and Debugging

### 1. Railway Monitoring
- Use Railway's built-in logs and metrics
- Set up deployment notifications
- Monitor resource usage

### 2. Debugging Call Issues
- Check Twilio logs for call events
- Review application logs with timestamps
- Use the dashboard to monitor active calls
- Test with Twilio test credentials

### 3. Real-time Updates Issues
- Verify Pusher connection status
- Check browser console for WebSocket errors
- Confirm proper channel subscriptions

## Security Considerations

### 1. Environment Variables
- Store all credentials securely in Railway's environment variables
- Never commit sensitive information to version control
- Use an API key for Twilio instead of an auth token

### 2. Pusher Security
- Implement the Pusher auth endpoint properly
- Validate channel access for private channels
- Keep your Pusher secret secure

### 3. API Security
- Protect sensitive endpoints
- Validate all incoming Twilio webhook requests
- Implement proper error handling to avoid exposing details

## Call Flow Optimization

### 1. Speech Recognition
- Use the `enhanced: true` flag for better recognition
- Set appropriate timeout values for user speech
- Use speech hints for common words
- Set the proper speech model for phone calls

### 2. AI Responses
- Optimize prompts for brief, natural responses
- Implement streaming for real-time feedback
- Ensure proper error handling for AI requests
- Use appropriate voice settings for clarity

## Testing and Maintenance

### 1. Testing Calls
```bash
# Use Twilio CLI to test calls
npm install -g twilio-cli
twilio phone-numbers:update your-twilio-number --sms-url=https://your-app.railway.app/api/incoming-call

# Make a test call
twilio api:core:calls:create --from your-twilio-number --to your-phone-number --url https://your-app.railway.app/api/incoming-call
```

### 2. Updates and Maintenance
```bash
# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### 3. Checking Logs in Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# View logs
railway logs

# View specific service logs
railway logs -s your-service-name
```

## Troubleshooting

### Common Issues

1. **Twilio Call Issues**
   - Verify webhook URL is correct and accessible
   - Check Twilio phone number configuration
   - Ensure your TwiML responses are valid
   - Verify proper call flow with Twilio logs

2. **Speech Recognition Problems**
   - Check gather verb settings in TwiML
   - Verify timeouts are appropriate
   - Review the full form data coming from Twilio
   - Test with different speech hints

3. **Pusher Connection Issues**
   - Verify Pusher credentials are correct
   - Check WebSocket connectivity
   - Ensure channel names match between client and server
   - Verify authentication endpoint is working

4. **AI Response Problems**
   - Check Google API key and permissions
   - Review AI prompt for any issues
   - Ensure streaming implementation is correct
   - Validate TTS voice settings

2. **Memory Issues**
   - Monitor memory usage
   - Configure garbage collection
   - Optimize resource usage

3. **Database Performance**
   - Check query performance
   - Optimize indexes
   - Monitor connections

## Rollback Procedure

```bash
# 1. Switch to previous version
git checkout v1.0.0

# 2. Rebuild application
npm run build

# 3. Restart services
pm2 restart all

# 4. Verify deployment
curl https://your-domain.com/health
```
