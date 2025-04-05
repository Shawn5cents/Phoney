import { GoogleGenerativeAI, GenerativeModel, GenerationConfig, ChatSession } from '@google/generative-ai';
import { ConversationContext } from '../types/audio';
import { AIPersonalityConfig } from './voice-processing';

/**
 * Options for configuring the Gemini stream
 */
interface StreamOptions {
  personality: {
    systemPrompt: string;
    voiceId: string;
    traits: string[];
    temperature?: number;
    examples?: { input: string; response: string }[];
  };
  context: string[];
}

/**
 * Configuration for the Gemini model
 */
interface GeminiModelConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
}

/**
 * Default model configuration
 */
const DEFAULT_MODEL_CONFIG: GeminiModelConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 200,
};

/**
 * Class for handling streaming interactions with Google's Gemini AI
 */
export class GeminiStream {
  private model: GenerativeModel;
  private context: string[];
  private personality: StreamOptions['personality'];
  private chat: ChatSession | null;
  private apiKey: string;

  /**
   * Private constructor - use create() factory method instead
   */
  private constructor(model: GenerativeModel, options: StreamOptions, apiKey: string) {
    this.model = model;
    this.context = options.context || [];
    this.personality = options.personality;
    this.chat = null;
    this.apiKey = apiKey;
  }

  /**
   * Create a new GeminiStream instance
   * @param options Configuration options
   * @returns A configured GeminiStream instance
   */
  static async create(options: StreamOptions): Promise<GeminiStream> {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is not set');
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Use personality temperature if provided, otherwise use default
      const modelConfig: GeminiModelConfig = {
        ...DEFAULT_MODEL_CONFIG,
        temperature: options.personality.temperature ?? DEFAULT_MODEL_CONFIG.temperature,
      };
      
      const model = genAI.getGenerativeModel({
        model: 'gemini-pro',
        generationConfig: modelConfig,
      });

      const instance = new GeminiStream(model, options, apiKey);
      await instance.initializeChat();
      return instance;
    } catch (error) {
      console.error('Failed to create GeminiStream:', error);
      throw new Error('Failed to initialize AI model');
    }
  }

  /**
   * Initialize the chat session with system prompt and context
   */
  private async initializeChat(): Promise<void> {
    try {
      // Format examples if they exist
      const examplesPrompt = this.personality.examples && this.personality.examples.length > 0
        ? '\n\nHere are some examples of how to respond:\n' + 
          this.personality.examples.map(ex => `User: ${ex.input}\nYou: ${ex.response}`).join('\n\n')
        : '';
      
      // Build the system prompt with personality traits and context
      const systemPrompt = `${this.personality.systemPrompt}\n\n` +
        `You are an AI assistant with these traits: ${this.personality.traits.join(', ')}. \n` +
        `Respond naturally in a conversational style while maintaining the personality traits above.\n` +
        `Keep responses concise and focused.${examplesPrompt}\n\n` +
        `Previous conversation context:\n` +
        `${this.context.join('\n')}`;

      // Start the chat session with the system prompt
      this.chat = await this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'I understand my role and personality. I will engage naturally while maintaining the specified traits.' }],
          },
        ],
      });
    } catch (error) {
      console.error('Error initializing chat:', error);
      throw new Error('Failed to initialize chat session');
    }
  }

  /**
   * Generate a response to user input
   * @param input User input text
   * @returns AI response text
   */
  public async generateResponse(input: string): Promise<string> {
    if (!this.chat) {
      await this.initializeChat();
      if (!this.chat) {
        return 'I apologize, but I encountered an issue initializing the conversation.';
      }
    }
    
    if (!input || input.trim() === '') {
      return 'I didn\'t catch that. Could you please say something?';
    }

    try {
      const result = await this.chat.sendMessageStream(input);
      let response = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        response += chunkText;
      }

      return response || 'I\'m not sure how to respond to that.';
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Try to reinitialize chat on error
      try {
        await this.initializeChat();
      } catch (reinitError) {
        console.error('Failed to reinitialize chat after error:', reinitError);
      }
      
      return 'I apologize, but I encountered an issue processing your request. Could you please repeat that?';
    }
  }

  /**
   * Stream a response to user input with callback for each chunk
   * @param input User input text
   * @param onChunk Callback function for each text chunk
   */
  public async streamResponse(input: string, onChunk: (chunk: string) => void): Promise<void> {
    if (!this.chat) {
      try {
        await this.initializeChat();
      } catch (error) {
        onChunk('I apologize, but I encountered an issue initializing the conversation.');
        return;
      }
    }
    
    if (!input || input.trim() === '') {
      onChunk('I didn\'t catch that. Could you please say something?');
      return;
    }

    try {
      const result = await this.chat!.sendMessageStream(input);
      let hasContent = false;
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          hasContent = true;
          onChunk(chunkText);
        }
      }
      
      if (!hasContent) {
        onChunk('I\'m not sure how to respond to that.');
      }
    } catch (error) {
      console.error('Error streaming response:', error);
      
      // Try to reinitialize chat on error
      try {
        await this.initializeChat();
      } catch (reinitError) {
        console.error('Failed to reinitialize chat after streaming error:', reinitError);
      }
      
      onChunk('I apologize, but I encountered an issue. Could you please repeat that?');
    }
  }

  /**
   * Update the conversation context
   * @param newContext New context array
   */
  public updateContext(newContext: string[]): void {
    this.context = newContext || [];
    // Reinitialize chat with new context if needed
    if (this.chat) {
      this.initializeChat().catch(error => {
        console.error('Error reinitializing chat after context update:', error);
      });
    }
  }

  /**
   * Close the chat session and clean up resources
   */
  public close(): void {
    this.chat = null;
  }
}

/**
 * Helper function to stream a Gemini response for a given input and personality
 * @param input User input text
 * @param context Previous conversation context
 * @param personality AI personality configuration
 * @returns AI response text
 */
export async function streamGeminiResponse(
  input: string, 
  context: string[], 
  personality: AIPersonalityConfig
): Promise<string> {
  try {
    const stream = await GeminiStream.create({
      personality,
      context: context || []
    });
    
    const response = await stream.generateResponse(input);
    stream.close();
    return response;
  } catch (error) {
    console.error('Error in streamGeminiResponse:', error);
    return 'I apologize, but I encountered a technical issue. Please try again in a moment.';
  }
}
