export enum HarmCategory {
  HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
  HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
  SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  DANGEROUS = 'HARM_CATEGORY_DANGEROUS_CONTENT'
}

export enum HarmBlockThreshold {
  UNSPECIFIED = 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
  LOW = 'BLOCK_LOW_AND_ABOVE',
  MEDIUM = 'BLOCK_MEDIUM_AND_ABOVE',
  HIGH = 'BLOCK_ONLY_HIGH'
}

export interface SafetySetting {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
}

export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

export interface ChatHistory {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface ChatOptions {
  history?: ChatHistory[];
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
}

export interface StreamResult {
  stream: AsyncIterable<{
    text: () => string;
  }>;
}

export interface GenerativeModel {
  startChat: (options: ChatOptions) => Promise<Chat>;
  generateContentStream: (prompt: string) => Promise<StreamResult>;
}

export interface Chat {
  sendMessageStream: (message: string) => Promise<StreamResult>;
}