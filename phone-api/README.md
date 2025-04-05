# Phoney Phone API

This service handles the voice call processing for the Phoney application, deployed on Railway.app for improved reliability and cost optimization.

## Why Railway.app?

- **Long-running requests**: Railway.app has no request timeout limits (vs. 10 seconds on Vercel)
- **Reliable TTS**: Better reliability for Google Text-to-Speech integration
- **Persistent filesystem**: File-based caching of TTS responses reduces API costs
- **Cost-effective**: $5-10/month with free tier available for low volume
- **Simple deployments**: GitHub integration similar to Vercel

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

3. **Run locally for development**:
   ```bash
   npm run dev
   ```

4. **Deploy to Google Cloud**:
   ```bash
   npm run deploy
   ```

## API Endpoints

- **POST /api/incoming-call**: Handle incoming Twilio calls
- **POST /api/process-speech**: Process speech during calls
- **POST /api/transfer-call**: Transfer a call to another number
- **POST /api/set-personality**: Change the active AI personality

## Integration with Vercel Dashboard

The Cloud Run service communicates with the Vercel dashboard through Pusher channels:

1. `calls`: Main channel for all call activity
2. `call-{sid}`: Individual call channel for transcripts and status

## Architecture Overview

```
┌─────────────┐       ┌────────────────┐      ┌──────────────┐ 
│             │       │                │      │              │
│   Twilio    │◄─────►│  Cloud Run API │◄────►│ Google Cloud │
│             │       │                │      │              │
└─────────────┘       └────────────────┘      └──────────────┘
                            ▲                    
                            │                    
                            ▼                    
                      ┌────────────┐         ┌──────────┐
                      │            │         │          │
                      │   Pusher   │◄────────┤  Vercel  │
                      │            │         │          │
                      └────────────┘         └──────────┘
```

## Environment Variables

See `.env.example` for required environment variables.
