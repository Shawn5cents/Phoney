import { SayVoice } from 'twilio/lib/twiml/VoiceResponse';

type SafetySetting = {
  category: 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_HATE_SPEECH' | 'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_DANGEROUS_CONTENT';
  threshold: 'BLOCK_LOW_AND_ABOVE' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_ONLY_HIGH';
};

export interface AIPersonalityConfig {
  name: string;
  systemPrompt: string;
  voiceId: SayVoice;
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

  constructor() {
    this.personalities = new Map();
    
    // Initialize default personality
    this.defaultPersonality = {
      name: "Professional Assistant",
      systemPrompt: `You are a professional AI assistant focused on being helpful and efficient.
      Keep responses clear, concise, and solution-oriented.`,
      voiceId: 'en-US-Neural2-D',
      traits: ["Professional", "Efficient", "Helpful"],
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ],
      temperature: 0.7
    };

    // Register default personalities
    this.registerPersonality('professional', {
      name: "Executive Assistant",
      systemPrompt: `You are a professional executive assistant with a formal business tone.
      Focus on efficiency and clarity in all communications.`,
      voiceId: 'en-US-Neural2-F',
      traits: ["Professional", "Formal", "Efficient"],
      temperature: 0.6
    });

    this.registerPersonality('friendly', {
      name: "Friendly Helper",
      systemPrompt: `You are a warm and approachable assistant who makes people feel comfortable.
      Use casual language while remaining professional and helpful.`,
      voiceId: 'en-US-Neural2-C',
      traits: ["Friendly", "Warm", "Approachable"],
      temperature: 0.8
    });

    this.registerPersonality('witty', {
      name: "Witty Companion",
      systemPrompt: `You are a clever and entertaining assistant who uses appropriate humor.
      Keep responses engaging while staying professional and helpful.`,
      voiceId: 'en-US-Neural2-D',
      traits: ["Witty", "Clever", "Engaging"],
      temperature: 0.85
    });

    this.registerPersonality('zen', {
      name: "Zen Guide",
      systemPrompt: `You are a calm and mindful assistant who helps maintain peace and clarity.
      Speak with tranquility and focus on understanding.`,
      voiceId: 'en-US-Neural2-A',
      traits: ["Calm", "Mindful", "Patient"],
      temperature: 0.7
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

  public listPersonalities(): string[] {
    return Array.from(this.personalities.keys());
  }

  public updatePersonality(id: string, updates: Partial<AIPersonalityConfig>) {
    const current = this.getPersonality(id);
    this.personalities.set(id, { ...current, ...updates });
  }
}

export const personalityStore = new PersonalityStore();
