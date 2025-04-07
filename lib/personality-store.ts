import { SayVoice } from 'twilio/lib/twiml/VoiceResponse';
import { VoiceConfig } from '../types/voice';

/**
 * AI model safety settings for content filtering
 */
export type SafetySetting = {
  category: 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_HATE_SPEECH' | 'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_DANGEROUS_CONTENT';
  threshold: 'BLOCK_LOW_AND_ABOVE' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_ONLY_HIGH';
};

/**
 * Example conversation for personality training
 */
export interface ConversationExample {
  input: string;
  response: string;
}

/**
 * Configuration for an AI personality
 */
export interface AIPersonalityConfig {
  name: string;
  systemPrompt: string;
  voiceId: string; // Google Cloud TTS voice name
  voiceConfig: VoiceConfig;
  traits: string[];
  safetySettings?: SafetySetting[];
  temperature?: number;
  examples?: ConversationExample[];
}

/**
 * Events emitted by the personality store
 */
export type PersonalityEvent = {
  type: 'personality-changed';
  id: string;
  name: string;
};

/**
 * Manages AI personalities and their configurations
 */
class PersonalityStore {
  private personalities: Map<string, AIPersonalityConfig>;
  private defaultPersonality: AIPersonalityConfig;
  private currentPersonality: string = 'casual';
  private eventListeners: ((event: PersonalityEvent) => void)[] = [];

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
      voiceId: 'echo',
      voiceConfig: {
        languageCode: 'en-US',
        name: 'echo',
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
      voiceId: 'nova',
      voiceConfig: {
        languageCode: 'en-US',
        name: 'nova',
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

  /**
   * Register a new personality or update an existing one
   * @param id Unique identifier for the personality
   * @param config Personality configuration (partial, will be merged with defaults)
   * @returns The complete personality configuration
   */
  public registerPersonality(id: string, config: Partial<AIPersonalityConfig>): AIPersonalityConfig {
    if (!id || typeof id !== 'string') {
      throw new Error('Personality ID must be a non-empty string');
    }

    const fullConfig: AIPersonalityConfig = {
      ...this.defaultPersonality,
      ...config,
      safetySettings: config.safetySettings || this.defaultPersonality.safetySettings
    };

    this.personalities.set(id, fullConfig);
    return fullConfig;
  }

  /**
   * Get a personality by ID
   * @param id Personality identifier
   * @returns The personality configuration or default if not found
   */
  public getPersonality(id: string): AIPersonalityConfig {
    if (!id) return this.defaultPersonality;
    return this.personalities.get(id) || this.defaultPersonality;
  }

  /**
   * Get the currently active personality
   * @returns The current personality configuration
   */
  public getCurrentPersonality(): AIPersonalityConfig {
    return this.getPersonality(this.currentPersonality);
  }

  /**
   * Set the current active personality
   * @param id Personality identifier
   * @returns True if successful, false if personality not found
   */
  public setCurrentPersonality(id: string): boolean {
    if (!id || !this.personalities.has(id)) {
      console.warn(`Personality '${id}' not found, using default`);
      return false;
    }
    
    const previousId = this.currentPersonality;
    this.currentPersonality = id;
    
    // Notify listeners of the change
    const personality = this.getPersonality(id);
    this.notifyListeners({
      type: 'personality-changed',
      id,
      name: personality.name
    });
    
    console.log(`Personality changed from '${previousId}' to '${id}'`);
    return true;
  }

  /**
   * Get a list of all available personality IDs
   * @returns Array of personality identifiers
   */
  public listPersonalities(): string[] {
    return Array.from(this.personalities.keys());
  }

  /**
   * Get all personality configurations
   * @returns Map of personality IDs to configurations
   */
  public getAllPersonalities(): Map<string, AIPersonalityConfig> {
    return new Map(this.personalities);
  }

  /**
   * Update an existing personality
   * @param id Personality identifier
   * @param updates Partial updates to apply
   * @returns Updated personality or null if not found
   */
  public updatePersonality(id: string, updates: Partial<AIPersonalityConfig>): AIPersonalityConfig | null {
    if (!id || !this.personalities.has(id)) {
      console.warn(`Cannot update: Personality '${id}' not found`);
      return null;
    }
    
    const current = this.getPersonality(id);
    const updated = { ...current, ...updates };
    this.personalities.set(id, updated);
    
    // If this is the current personality, notify listeners
    if (id === this.currentPersonality) {
      this.notifyListeners({
        type: 'personality-changed',
        id,
        name: updated.name
      });
    }
    
    return updated;
  }

  /**
   * Delete a personality
   * @param id Personality identifier
   * @returns True if deleted, false if not found
   */
  public deletePersonality(id: string): boolean {
    if (!id || !this.personalities.has(id)) {
      return false;
    }
    
    // Don't allow deleting the current personality
    if (id === this.currentPersonality) {
      console.warn(`Cannot delete the currently active personality: '${id}'`);
      return false;
    }
    
    return this.personalities.delete(id);
  }

  /**
   * Add an event listener for personality changes
   * @param listener Function to call when events occur
   */
  public addEventListener(listener: (event: PersonalityEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove an event listener
   * @param listener Function to remove
   */
  public removeEventListener(listener: (event: PersonalityEvent) => void): void {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of an event
   * @param event Event to broadcast
   */
  private notifyListeners(event: PersonalityEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in personality event listener:', error);
      }
    });
  }
}

// Export a singleton instance of the personality store
export const personalityStore = new PersonalityStore();
