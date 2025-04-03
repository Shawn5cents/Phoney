# AI Call Assistant

A Next.js application that forwards phone calls to an AI assistant with real-time transcription, call monitoring, and human intervention capabilities.

## Features

- Forward any phone number to an AI assistant
- Real-time call transcription
- Live call monitoring
- Human intervention capability
- Call logs and analytics
- Custom AI voice using ElevenLabs

## Tech Stack

- Frontend: Next.js (App Router + TypeScript)
- Backend: Next.js API Routes
- AI: OpenAI GPT-4 + ElevenLabs
- Telephony: Twilio API
- Real-time Updates: Pusher
- Styling: Tailwind CSS

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your credentials:
   - Twilio credentials
   - OpenAI API key
   - ElevenLabs API key and voice ID
   - Pusher credentials

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Configure your Twilio number to point to your webhook URL:
   ```
   [Your Domain]/api/incoming-call
   ```

## Usage

1. Visit the dashboard at `/dashboard`
2. Enter your phone number
3. Click "Activate AI Assistant"
4. Your calls will now be handled by the AI assistant
5. Monitor calls in real-time from the dashboard
6. Take over any call by clicking "Take Over Call"

## Environment Variables

```env
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

OPENAI_API_KEY=your_openai_key

ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id

PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster

NEXT_PUBLIC_BASE_URL=your_app_url
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
```

## License

MIT
