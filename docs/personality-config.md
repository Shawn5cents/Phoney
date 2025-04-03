# AI Personality Configuration Guide

## Overview

Phoney's AI personality system allows you to customize how your AI assistant interacts with callers. Each personality is defined by a set of characteristics that influence the AI's responses, tone, and voice.

## Built-in Personalities

### 👔 Professional Assistant
- **Use Case**: Corporate environments, business services
- **Traits**: Professional, efficient, business-focused
- **Voice**: Clear, authoritative (en-US-JennyNeural)
- **Example Interactions**:
  - Scheduling meetings
  - Handling customer inquiries
  - Processing service requests

### 😊 Friendly Helper
- **Use Case**: Customer service, retail, hospitality
- **Traits**: Warm, approachable, empathetic
- **Voice**: Friendly, welcoming (en-US-AmberNeural)
- **Example Interactions**:
  - Welcoming customers
  - Providing product information
  - Handling support requests

### 😄 Witty Companion
- **Use Case**: Entertainment, casual brands, social media
- **Traits**: Clever, humorous, engaging
- **Voice**: Dynamic, energetic (en-US-DavisNeural)
- **Example Interactions**:
  - Event information
  - Creative services
  - Social engagement

### 🧘 Zen Guide
- **Use Case**: Wellness, healthcare, meditation
- **Traits**: Calm, mindful, patient
- **Voice**: Soothing, measured (en-US-GuyNeural)
- **Example Interactions**:
  - Wellness consultations
  - Appointment scheduling
  - Guided assistance

## Creating Custom Personalities

### Personality Interface

```typescript
interface AIPersonality {
  name: string;          // Display name
  description: string;   // Brief description
  systemPrompt: string;  // OpenAI system prompt
  voiceId: string;      // Text-to-speech voice ID
  traits: string[];     // Personality characteristics
  examples: {           // Example conversations
    input: string;
    response: string;
  }[];
}
```

### Example Implementation

```typescript
const customPersonality = {
  name: "Tech Support",
  description: "Technical support specialist",
  systemPrompt: `You are a technical support specialist with the following traits:
- Patient and understanding
- Technical expertise
- Clear communication
- Solution-oriented

Focus on guiding users through technical issues step by step.
Use clear, precise language while maintaining a helpful tone.`,
  voiceId: "en-US-TonyNeural",
  traits: ["Technical", "Patient", "Precise", "Helpful"],
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
   - Match voice to personality traits
   - Consider your target audience
   - Test for clarity and naturalness
   - Ensure consistent speed and tone

4. **Personality Traits**
   - List 3-5 core characteristics
   - Make traits actionable
   - Ensure traits complement each other
   - Align with business needs

## Real-time Switching

The dashboard allows instant switching between personalities:

1. Select desired personality from the grid
2. System automatically updates:
   - AI prompt configuration
   - Voice settings
   - Conversation examples
   - Response patterns

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

- All personality configurations are stored securely
- Voice data is processed in compliance with privacy standards
- System prompts are encrypted in transit
- Access controls for personality management

## Support and Resources

- [API Documentation](https://shawn5cents.github.io/Phoney/api-reference)
- [Voice Configuration](https://shawn5cents.github.io/Phoney/voice-config)
- [Example Gallery](https://shawn5cents.github.io/Phoney/examples)
- [Community Templates](https://shawn5cents.github.io/Phoney/templates)
