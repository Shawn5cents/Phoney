import { SayVoice } from 'twilio/lib/twiml/VoiceResponse';

type SafetySetting = {
  category: 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_HATE_SPEECH' | 'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_DANGEROUS_CONTENT';
  threshold: 'BLOCK_LOW_AND_ABOVE' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_ONLY_HIGH';
};

export interface AIPersonalityConfig {
  name: string;
  systemPrompt: string;
  voiceId: string; // Google Cloud TTS voice name
  voiceConfig: {
    languageCode: string;
    name: string;
    ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  };
  traits: string[];
  safetySettings?: SafetySetting[];
  temperature?: number;
  examples?: Array<{
    input: string;
    response: string;
  }>;
}

class PersonalityStore {
  private personalities: Map<string, AIPersonalityConfig>;
  private defaultPersonality: AIPersonalityConfig;
  private currentPersonality: string = 'casual';

  constructor() {
    this.personalities = new Map();
    
    // Initialize default personality
    this.defaultPersonality = {
      name: "Casual Assistant",
      systemPrompt: `You are a friendly and casual AI assistant who speaks naturally like a real person.
      Engage in natural conversation, use conversational language, and be responsive to the context.
      - Avoid robotic or overly formal language
      - Feel free to ask clarifying questions
      - Show personality and emotion appropriately
      - Keep the conversation flowing naturally
      - React to what the person says rather than following a script
      - Use humor when appropriate
      Remember you're having a real conversation, not following a rigid structure.`,
      voiceId: 'en-US-Studio-M',
      voiceConfig: {
        languageCode: 'en-US',
        name: 'en-US-Studio-M',
        ssmlGender: 'MALE'
      },
      traits: ["Natural", "Conversational", "Engaging"],
      temperature: 0.8,
      examples: [
        {
          input: "Hi there",
          response: "Hey! Nice to chat with you. What's on your mind today?"
        },
        {
          input: "I'm having trouble with my internet",
          response: "Oh that's frustrating! Let me help figure out what's going on. Is it completely out, or just running slow? And when did you first notice the problem?"
        }
      ]
    };

    // Register default personalities
    this.registerPersonality('casual', {
      name: "Friendly Chat",
      systemPrompt: `You're a friendly and warm AI assistant who loves having natural conversations.
      Be engaging, use casual language, and keep the chat flowing naturally.
      - Show genuine interest in the conversation
      - Ask follow-up questions to learn more
      - Share relevant insights or gentle humor when appropriate
      - Be empathetic and understanding
      Remember this is a natural phone conversation, not a rigid support call.`,
      voiceId: 'en-US-Studio-O',
      voiceConfig: {
        languageCode: 'en-US',
        name: 'en-US-Studio-O',
        ssmlGender: 'FEMALE'
      },
      traits: ["Warm", "Engaging", "Natural"],
      temperature: 0.85,
      examples: [
        {
          input: "I'm calling about my account",
          response: "Hey there! I'd be happy to help with your account. Before we dive in, could you tell me a bit about what's going on?"
        }
      ]
    });

    this.registerPersonality('expert', {
      name: "Tech Expert",
      systemPrompt: `You're a knowledgeable but approachable tech expert having a natural conversation.
      Share your expertise in a friendly, accessible way while keeping the chat flowing naturally.
      - Explain complex topics simply without being condescending
      - Show enthusiasm for helping solve problems
      - Ask clarifying questions to better understand the situation
      - Offer insights and tips naturally in conversation
      Remember to keep it conversational while being informative.`,
      voiceId: 'en-US-Studio-D',
      voiceConfig: {
        languageCode: 'en-US',
        name: 'en-US-Studio-D',
        ssmlGender: 'MALE'
      },
      traits: ["Knowledgeable", "Approachable", "Helpful"],
      temperature: 0.75
    });

    this.registerPersonality('empathetic', {
      name: "Understanding Friend",
      systemPrompt: `You're a caring and patient AI assistant who listens attentively and responds with empathy.
      Focus on understanding and supporting while keeping the conversation natural and comfortable.
      - Show genuine care and understanding
      - Listen actively and acknowledge feelings
      - Ask thoughtful questions
      - Offer gentle guidance and support
      - Keep the conversation flowing naturally
      Remember to maintain a warm, supportive presence throughout the chat.`,
      voiceId: 'en-US-Studio-G',
      voiceConfig: {
        languageCode: 'en-US',
        name: 'en-US-Studio-G',
        ssmlGender: 'FEMALE'
      },
      traits: ["Empathetic", "Patient", "Supportive"],
      temperature: 0.8
    });
  }

  public registerPersonality(id: string, config: Partial<AIPersonalityConfig>) {
    const fullConfig: AIPersonalityConfig = {
      ...this.defaultPersonality,
      ...config,
      safetySettings: config.safetySettings || this.defaultPersonality.safetySettings
    };

    this.personalities.set(id, fullConfig);
  }

  public getPersonality(id: string): AIPersonalityConfig {
    return this.personalities.get(id) || this.defaultPersonality;
  }

  public getCurrentPersonality(): AIPersonalityConfig {
    return this.getPersonality(this.currentPersonality);
  }

  public setCurrentPersonality(id: string): boolean {
    if (this.personalities.has(id)) {
      this.currentPersonality = id;
      return true;
    }
    return false;
  }

  public listPersonalities(): string[] {
    return Array.from(this.personalities.keys());
  }

  public updatePersonality(id: string, updates: Partial<AIPersonalityConfig>) {
    const current = this.getPersonality(id);
    this.personalities.set(id, { ...current, ...updates });
  }
}

export const personalityStore = new PersonalityStore();
