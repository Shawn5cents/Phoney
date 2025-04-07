# Project Context Summary

## Recent Major Changes

### Migration to OpenAI Speech Models (April 2025)

The project has been migrated from Google Cloud services to OpenAI's new speech models for improved performance and capabilities:

1. **Speech-to-Text Updates**:
- Replaced Google Cloud Speech-to-Text with OpenAI's `gpt-4o-transcribe`
- Improved transcription accuracy and noise handling
- Better accent and dialect recognition
- Enhanced real-time streaming capabilities

2. **Text-to-Speech Updates**:
- Replaced Google TTS with OpenAI's `gpt-4o-mini-tts`
- New voice options with more natural sound:
  - `nova`: Clear female voice (Professional)
  - `onyx`: Deep male voice (Authoritative)
  - `fable`: Expressive female voice (Engaging)
  - `alloy`: Neutral voice (Balanced)
  - `echo`: Deep male voice (Alternative)
  - `shimmer`: Warm female voice (Friendly)

3. **Voice Personality System**:
- Updated voice mappings for all AI personalities
- Maintained existing personality traits and behaviors
- Enhanced voice quality and expressiveness
- Simplified voice configuration

4. **Technical Updates**:
- Removed Google Cloud dependencies
- Added OpenAI SDK v4.28.0
- Updated environment configuration
- Streamlined API integration

## Core Features

1. **Phone System**:
- Twilio-based call handling
- Real-time transcription
- AI-powered conversations
- Call transfer capabilities

2. **AI Personalities**:
- Professional Assistant (using `onyx` voice)
- Friendly Helper (using `nova` voice)
- Witty Companion (using `fable` voice)
- Zen Guide (using `alloy` voice)

3. **Real-time Features**:
- Live transcription display
- Call monitoring
- Personality switching
- Call controls

4. **Technical Stack**:
- Next.js 14 with TypeScript
- OpenAI Speech APIs
- Twilio for telephony
- Pusher for real-time updates

## Deployment

- Hosted on Vercel
- Automatic deployments from main branch
- Environment variables managed through Vercel
- Requires OpenAI and Twilio credentials

## Future Plans

1. **Voice Enhancements**:
- Explore custom voice creation
- Implement more sophisticated voice controls
- Add support for multiple languages

2. **AI Improvements**:
- Enhanced conversation context
- Better call routing logic
- More personality options

3. **Dashboard Features**:
- Advanced call analytics
- Voice quality metrics
- User preference management

## Documentation

All project documentation has been updated to reflect the migration to OpenAI's speech services. Key documents include:
- README.md
- getting-started.md
- architecture.md
- personality-config.md
- api-reference.md
