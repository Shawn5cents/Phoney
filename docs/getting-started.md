# 🚀 Getting Started with Phoney

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- A Twilio account with a purchased phone number
- A Google Cloud account with:
  - Gemini API access
  - Cloud Speech-to-Text API access
  - Text-to-Speech API access
- A Pusher Channels account

## ⚡ Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/yourusername/phoney.git
   cd phoney
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Fill in your API keys and credentials in `.env` with the following variables:
   ```
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

   # Pusher Configuration
   PUSHER_APP_ID=your_pusher_app_id
   PUSHER_KEY=your_pusher_key
   PUSHER_SECRET=your_pusher_secret
   PUSHER_CLUSTER=your_pusher_cluster
   NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
   NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3001`

## 🔧 Configuration

### Twilio Setup
1. Create a Twilio account at [twilio.com](https://www.twilio.com)
2. Purchase a phone number with voice capabilities
3. Create an API key and secret in the Twilio console for authentication
4. Configure your phone number's voice webhook URL to `[Your Domain]/api/incoming-call` with HTTP POST method
5. Enable WebSocket features in your Twilio account settings
6. Set up Media Streams in your Twilio console:
   - Enable "Process audio with WebSocket"
   - Set WebSocket URL to `[Your Domain]/api/audio-stream`
   - Configure audio format to MULAW

### Google Cloud Setup
1. Create a project in the [Google Cloud Console](https://console.cloud.google.com)
2. Enable required APIs:
   - Gemini API
   - Cloud Speech-to-Text API
   - Cloud Text-to-Speech API
3. Create a service account with access to these APIs
4. Download the service account key file
5. Enable real-time streaming features for Speech-to-Text
6. Configure speech recognition model for phone calls

### Pusher Setup
1. Create a Pusher Channels account at [pusher.com](https://pusher.com)
2. Create a new Channels app in your dashboard
3. Note your app ID, key, secret, and cluster
4. Enable client events for real-time updates
5. Configure WebSocket cluster settings

## 🎯 First Call

1. Start the development server
2. Open the dashboard at `http://localhost:3001`
3. Make a test call to your Twilio number
4. Monitor in real-time:
   - Live audio streaming
   - Speech recognition
   - AI response generation
   - Voice synthesis

## 🔍 Dashboard Features

The main dashboard provides several features:
- Real-time call monitoring with live transcription
- Audio streaming visualization
- Speech recognition confidence indicators
- AI response streaming as it's being generated
- Personality switching for different caller experiences
- Call transfer capabilities
- Call history and status tracking

## 🎭 Personality Configuration

You can configure AI personalities in `lib/personality-store.ts`:
```typescript
this.registerPersonality('professional', {
  name: "Executive Assistant",
  systemPrompt: "You are a professional executive assistant...",
  voiceId: 'en-US-Neural2-F',
  traits: ["Professional", "Formal", "Efficient"],
  temperature: 0.6
});
```

## 🔈 Voice Activity Detection

The system includes automatic voice activity detection (VAD) that:
- Detects speech in real-time
- Manages conversation turn-taking
- Triggers AI responses at appropriate moments
- Handles silence detection

## 🐛 Troubleshooting

Common issues and solutions:

| Issue | Possible Solution |
| ----- | ----------------- |
| WebSocket connection fails | Check your Twilio Media Streams configuration and WebSocket URL |
| Speech recognition inaccurate | Verify Google Speech-to-Text model settings and audio format |
| Audio streaming delays | Check network latency and WebSocket connection status |
| Real-time transcription missing | Verify Google Cloud credentials and API permissions |
| AI responses slow | Monitor Gemini API quotas and streaming settings |
| Voice sounds robotic | Adjust Google TTS voice settings or try a different voice |
| Dashboard updates delayed | Check Pusher connection and event subscriptions |

For detailed logs:
- Check your application console
- Monitor WebSocket connections in browser dev tools
- Review Twilio console for call logs
- Examine Google Cloud Console for API metrics
- Inspect Pusher dashboard for real-time events

## 📊 Performance Monitoring

Monitor these metrics for optimal performance:
- WebSocket connection latency
- Speech recognition accuracy
- AI response generation time
- Voice synthesis speed
- Real-time update delays

Use the built-in dashboard metrics or integrate with your preferred monitoring solution.
