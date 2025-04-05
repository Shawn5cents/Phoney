export interface AudioStreamOptions {
  sampleRate: number;
  channels: number;
  encoding: 'LINEAR16' | 'MULAW';
  bitsPerSample: number;
}

export interface StreamMetadata {
  callSid: string;
  streamSid: string;
  timestamp: string;
}

export interface AudioChunk {
  metadata: StreamMetadata;
  payload: Buffer;
  isFinal: boolean;
}

export interface VADResult {
  isSpeech: boolean;
  confidence: number;
  startTime: number;
  endTime?: number;
}

export interface ConversationContext {
  history: string[];
  currentSpeech: string;
  lastResponse: string;
  personality: string;
  startTime: number;
  turnCount: number;
}