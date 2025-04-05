import { WebSocket } from 'ws';
import { VoiceActivityDetector } from './voice-activity-detector';
import { GeminiStream } from './gemini';
import { ConversationContext } from '../types/audio';
import { speechRecognitionService } from './speech-recognition';

export interface StreamData {
  vad: VoiceActivityDetector;
  context: ConversationContext;
  aiStream: GeminiStream | null;
  lastSpeechTime: number;
  lastActivity: number;
  ws: WebSocket;
}

export interface StreamConfig {
  maxHistoryLength: number;
  inactivityTimeout: number;
  maxConcurrentCalls: number;
}

const DEFAULT_STREAM_CONFIG: StreamConfig = {
  maxHistoryLength: 10,
  inactivityTimeout: 300000, // 5 minutes
  maxConcurrentCalls: 100
};

/**
 * Manages the lifecycle of audio streams
 */
export class StreamManager {
  private activeStreams: Map<string, StreamData>;
  private config: StreamConfig;

  constructor(config: Partial<StreamConfig> = {}) {
    this.activeStreams = new Map();
    this.config = { ...DEFAULT_STREAM_CONFIG, ...config };
  }

  /**
   * Creates a new stream
   */
  createStream(callSid: string, ws: WebSocket): StreamData | null {
    if (this.activeStreams.size >= this.config.maxConcurrentCalls) {
      return null;
    }

    const streamData: StreamData = {
      vad: new VoiceActivityDetector(),
      context: {
        history: [],
        currentSpeech: '',
        lastResponse: '',
        personality: 'professional',
        startTime: Date.now(),
        turnCount: 0
      },
      aiStream: null,
      lastSpeechTime: Date.now(),
      lastActivity: Date.now(),
      ws
    };

    this.activeStreams.set(callSid, streamData);
    return streamData;
  }

  /**
   * Gets an existing stream
   */
  getStream(callSid: string): StreamData | undefined {
    return this.activeStreams.get(callSid);
  }

  /**
   * Updates stream activity timestamp
   */
  updateActivity(callSid: string): void {
    const streamData = this.activeStreams.get(callSid);
    if (streamData) {
      streamData.lastActivity = Date.now();
    }
  }

  /**
   * Checks if a stream has exceeded inactivity timeout
   */
  isInactive(callSid: string): boolean {
    const streamData = this.activeStreams.get(callSid);
    if (!streamData) return true;

    return Date.now() - streamData.lastActivity > this.config.inactivityTimeout;
  }

  /**
   * Cleans up a stream and its resources
   */
  cleanupStream(callSid: string): void {
    const streamData = this.activeStreams.get(callSid);
    if (streamData) {
      if (streamData.aiStream) {
        streamData.aiStream.close();
      }
      if (streamData.ws.readyState === WebSocket.OPEN) {
        streamData.ws.close();
      }
      speechRecognitionService.closeStream(callSid);
      this.activeStreams.delete(callSid);
    }
  }

  /**
   * Gets the number of active streams
   */
  get activeStreamCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Gets the maximum history length
   */
  get maxHistoryLength(): number {
    return this.config.maxHistoryLength;
  }

  /**
   * Gets all active stream call SIDs
   */
  getActiveStreamIds(): string[] {
    return Array.from(this.activeStreams.keys());
  }

  /**
   * Cleans up all streams
   */
  cleanupAllStreams(): void {
    for (const callSid of this.activeStreams.keys()) {
      this.cleanupStream(callSid);
    }
  }
}
