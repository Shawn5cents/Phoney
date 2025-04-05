# 🚀 Getting Started with Phoney

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- A Twilio account with a purchased phone number
- A Google Cloud account with Gemini API and Text-to-Speech API access
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
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_API_KEY_SID=your_api_key_sid
   TWILIO_API_KEY_SECRET=your_api_key_secret
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   GOOGLE_API_KEY=your_google_api_key
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

### Google Cloud Setup
1. Create a project in the [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Gemini API and create an API key
3. Enable the Cloud Text-to-Speech API in the same project
4. Make sure your API key has access to both services

### Pusher Setup
1. Create a Pusher Channels account at [pusher.com](https://pusher.com)
2. Create a new Channels app in your dashboard
3. Note your app ID, key, secret, and cluster
4. Enable client events if you need client-to-client communication

## 🎯 First Call

1. Visit dashboard
2. Enter test phone number
3. Make test call
4. Monitor real-time transcription
5. Try human intervention

## 🔍 Dashboard Features

The main dashboard provides several features:
- Real-time call monitoring with live transcription
- AI response streaming as it's being generated
- Personality switching for different caller experiences
- Call transfer capabilities
- Call history and status tracking

## 🐛 Troubleshooting

Common issues and solutions:

| Issue | Possible Solution |
| ----- | ----------------- |
| Call connects but hangs up immediately | Verify your Twilio webhook URL is accessible and returning valid TwiML |
| No speech recognition | Check Twilio gather verb settings and timeout values |
| AI not responding properly | Review your Google API key permissions and Gemini prompt configuration |
| No real-time updates in dashboard | Verify Pusher credentials and check browser console for WebSocket errors |
| Voice sounds robotic or unclear | Adjust Google TTS voice settings or try a different voice |

For detailed logs, check your application console and the Twilio console for call logs.
