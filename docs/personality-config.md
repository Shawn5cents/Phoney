# AI Personality Configuration Guide

## Overview

Phoney's AI personality system allows you to customize how your AI assistant interacts with callers. Each personality is defined by a set of characteristics that influence the AI's responses, tone, and OpenAI voice settings.

## Built-in Personalities

### 👔 Professional Assistant
- **Use Case**: Corporate environments, business services
- **Traits**: Professional, efficient, business-focused
- **Voice**: Clear, authoritative (OpenAI: onyx)
- **Example Interactions**:
  - Scheduling meetings
  - Handling customer inquiries
  - Processing service requests

### 😊 Friendly Helper
- **Use Case**: Customer service, retail, hospitality
- **Traits**: Warm, approachable, empathetic
- **Voice**: Friendly, welcoming (OpenAI: nova)
- **Example Interactions**:
  - Welcoming customers
  - Providing product information
  - Handling support requests

### 😄 Witty Companion
- **Use Case**: Entertainment, casual brands, social media
- **Traits**: Clever, humorous, engaging
- **Voice**: Dynamic, energetic (OpenAI: fable)
- **Example Interactions**:
  - Event information
  - Creative services
  - Social engagement

### 🧘 Zen Guide
- **Use Case**: Wellness, healthcare, meditation
- **Traits**: Calm, mindful, patient
- **Voice**: Soothing, measured (OpenAI: alloy)
- **Example Interactions**:
  - Wellness consultations
  - Appointment scheduling
  - Guided assistance

## Creating Custom Personalities

### Personality Interface

```typescript
interface AIPersonality {
  id: string;           // Unique identifier
  name: string;         // Display name
  description: string;  // Brief description
  systemPrompt: string; // Google Gemini system prompt
  voiceSettings: {      // OpenAI voice settings
    languageCode: string; // e.g., "en-US"
    name: string;        // e.g., "nova" or "onyx"
    ssmlGender: "NEUTRAL" | "MALE" | "FEMALE";
  };
  examples: {          // Example conversations for context
    input: string;
    response: string;
  }[];
}
```

### Example Implementation

```typescript
const customPersonality = {
  id: "tech-support",
  name: "Tech Support",
  description: "Technical support specialist",
  systemPrompt: `You are a technical support specialist with the following traits:
- Patient and understanding
- Technical expertise
- Clear communication
- Solution-oriented

You're answering phone calls for technical support.
Focus on guiding callers through technical issues step by step.
Use clear, precise language while maintaining a helpful tone.
Keep responses concise and suitable for voice conversation.`,
  voiceSettings: {
    languageCode: "en-US",
    name: "en-US-Neural2-D",
    ssmlGender: "MALE"
  },
  examples: [
    {
      input: "My internet isn't working",
      response: "I understand that's frustrating. Let's troubleshoot this together. First, could you tell me if your router's power light is on?"
    },
    {
      input: "How do I reset my password?",
      response: "I'll guide you through the password reset process. Have you received the reset email we sent to your registered address?"
    }
  ]
};
```

## Best Practices

1. **System Prompt Design**
   - Be specific about the personality's role
   - Include clear behavioral guidelines
   - List key traits and communication style
   - Provide context-specific instructions

2. **Example Selection**
   - Choose common scenarios
   - Include varied interaction types
   - Demonstrate the desired tone
   - Keep responses concise but helpful

3. **Voice Selection**
   - Use Google TTS voice options
   - Select appropriate voice gender and style
   - Choose Studio-quality voices for best results
   - Test for clarity over phone connections
   - Adjust speech rate for natural conversation

4. **Personality Definition**
   - Create focused system prompts for Google Gemini
   - Include phone context in the prompt
   - Specify desired tone and style clearly
   - Ensure examples align with voice characteristics

## Real-time Switching

The dashboard allows instant switching between personalities for incoming calls:

1. Select desired personality from the dashboard grid
2. System automatically updates for the next caller:
   - Google Gemini prompt configuration
   - Google TTS voice settings
   - Conversation context examples
   - Response patterns and style

## Testing and Refinement

1. **Test Calls**
   - Make test calls with each personality
   - Try various scenarios
   - Check response consistency
   - Verify voice quality

2. **Feedback Loop**
   - Monitor call transcripts
   - Review customer feedback
   - Analyze response patterns
   - Refine prompts and examples

3. **Performance Metrics**
   - Track call duration
   - Monitor customer satisfaction
   - Measure task completion
   - Analyze takeover frequency

## Security and Privacy

- All personality configurations are stored securely in code
- Voice data is processed through Google TTS in compliance with privacy standards
- AI prompts and responses are transmitted securely
- API keys are properly protected via environment variables
- Call data and transcripts are not permanently stored

## Google Service References

- [Google Gemini API Documentation](https://ai.google.dev/docs/gemini_api_overview)
- [Google Text-to-Speech Documentation](https://cloud.google.com/text-to-speech/docs)
- [Twilio TwiML Documentation](https://www.twilio.com/docs/voice/twiml)
- [Pusher Channels Documentation](https://pusher.com/docs/channels)

## Internal Documentation

- [API Reference](api-reference.md)
- [Architecture Overview](architecture.md)
- [Deployment Guide](deployment.md)
