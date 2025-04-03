# 🚀 Getting Started with Phoney

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- A Twilio account
- An OpenAI API key
- An ElevenLabs account
- A Pusher account

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
   Fill in your API keys and credentials in `.env`

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3001`

## 🔧 Configuration

### Twilio Setup
1. Get a Twilio phone number
2. Set webhook URL to `[Your Domain]/api/incoming-call`
3. Configure voice capabilities

### OpenAI Configuration
1. Set up GPT-4 access
2. Configure system prompts
3. Test responses

### ElevenLabs Voice
1. Create a custom voice
2. Get voice ID
3. Test voice output

### Pusher Setup
1. Create new channels app
2. Configure client events
3. Set up webhooks

## 🎯 First Call

1. Visit dashboard
2. Enter test phone number
3. Make test call
4. Monitor real-time transcription
5. Try human intervention

## 🔍 Monitoring

Access these dashboards:
- Call Analytics: `/dashboard/analytics`
- Real-time Monitor: `/dashboard/monitor`
- System Status: `/dashboard/status`

## 🐛 Troubleshooting

Common issues and solutions:
- Call not connecting? Check Twilio webhook
- No audio? Verify ElevenLabs setup
- Delayed responses? Check OpenAI quota
- No real-time updates? Verify Pusher config
