import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { ConversationContext } from '../types/audio';

interface StreamOptions {
  personality: {
    systemPrompt: string;
    voiceId: string;
    traits: string[];
  };
  context: string[];
}

export class GeminiStream {
  private model: GenerativeModel;
  private context: string[];
  private personality: StreamOptions['personality'];
  private chat: any; // Will be properly typed once chat feature is available

  private constructor(model: GenerativeModel, options: StreamOptions) {
    this.model = model;
    this.context = options.context;
    this.personality = options.personality;
    this.chat = null;
  }

  static async create(options: StreamOptions): Promise<GeminiStream> {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 200,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });

    const instance = new GeminiStream(model, options);
    await instance.initializeChat();
    return instance;
  }

  private async initializeChat() {
    // Initialize chat with system prompt and context
    const systemPrompt = `${this.personality.systemPrompt}\n\nYou are an AI assistant with these traits: ${this.personality.traits.join(', ')}. 
    Respond naturally in a conversational style while maintaining the personality traits above.
    Keep responses concise and focused.
    
    Previous conversation context:
    ${this.context.join('\n')}`;

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
  }

  public async generateResponse(input: string): Promise<string> {
    try {
      const result = await this.chat.sendMessageStream(input);
      let response = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        response += chunkText;
      }

      return response;
    } catch (error) {
      console.error('Error generating response:', error);
      return 'I apologize, but I encountered an issue processing your request. Could you please repeat that?';
    }
  }

  public async streamResponse(input: string, onChunk: (chunk: string) => void): Promise<void> {
    try {
      const result = await this.chat.sendMessageStream(input);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        onChunk(chunkText);
      }
    } catch (error) {
      console.error('Error streaming response:', error);
      onChunk('I apologize, but I encountered an issue. Could you please repeat that?');
    }
  }

  public updateContext(newContext: string[]) {
    this.context = newContext;
  }

  public close() {
    // Cleanup resources if needed
    this.chat = null;
  }
}
