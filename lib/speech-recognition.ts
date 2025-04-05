import { SpeechClient, protos } from '@google-cloud/speech';
import { AudioChunk } from '../types/audio';

interface SpeechRecognitionResult {
  text: string;
  isFinal: boolean;
  confidence: number;
}

type ResponseHandler = (response: protos.google.cloud.speech.v1.IStreamingRecognizeResponse) => void;
type SpeechRecognitionConfig = protos.google.cloud.speech.v1.IStreamingRecognitionConfig;
type StreamingResponse = protos.google.cloud.speech.v1.IStreamingRecognizeResponse;
type RecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig;
type RecognitionMetadata = protos.google.cloud.speech.v1.IRecognitionMetadata;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class SpeechRecognitionService {
  private client: SpeechClient;
  private streams: Map<string, {
    stream: any;
    lastActivity: number;
    listeners: Set<ResponseHandler>;
  }>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    try {
      this.client = new SpeechClient();
    } catch (error) {
      console.error('Failed to initialize Speech client:', error);
      throw new Error('Speech service initialization failed');
    }
    this.streams = new Map();
    this.startCleanupInterval();
  }

  private startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [callSid, streamData] of this.streams) {
        if (now - streamData.lastActivity > 300000) { // 5 minutes
          this.closeStream(callSid);
        }
      }
    }, 60000); // Check every minute
  }

  async createStream(callSid: string) {
    const config: RecognitionConfig = {
      encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.MULAW,
      sampleRateHertz: 8000,
      languageCode: 'en-US',
      model: 'phone_call',
      useEnhanced: true,
      enableAutomaticPunctuation: true,
      metadata: {
        interactionType: protos.google.cloud.speech.v1.RecognitionMetadata.InteractionType.PHONE_CALL,
        industryNaicsCodeOfAudio: 518210,
        originalMediaType: protos.google.cloud.speech.v1.RecognitionMetadata.OriginalMediaType.AUDIO
      }
    };

    const streamingConfig: SpeechRecognitionConfig = {
      config,
      interimResults: true
    };

    try {
      const recognizeStream = this.client.streamingRecognize(streamingConfig);
      
      // Set up error handling
      recognizeStream.on('error', (error: Error) => {
        console.error(`Speech recognition error for call ${callSid}:`, error);
        this.handleStreamError(callSid, error);
      });

      // Set up debug logging
      recognizeStream.on('response', (response: StreamingResponse) => {
        console.log(`Received speech response for call ${callSid}:`, 
          JSON.stringify(response, null, 2));
      });

      this.streams.set(callSid, {
        stream: recognizeStream,
        lastActivity: Date.now(),
        listeners: new Set()
      });

      return recognizeStream;
    } catch (error) {
      console.error(`Failed to create speech stream for call ${callSid}:`, error);
      throw error;
    }
  }

  private async handleStreamError(callSid: string, error: Error) {
    const streamData = this.streams.get(callSid);
    if (!streamData) return;

    try {
      // Clean up existing stream
      this.closeStream(callSid);

      // Attempt to recreate stream
      const newStream = await this.createStream(callSid);
      
      // Reattach existing listeners
      for (const listener of streamData.listeners) {
        newStream.on('data', listener as (...args: any[]) => void);
      }
    } catch (recreateError) {
      console.error(`Failed to recreate stream for call ${callSid}:`, recreateError);
    }
  }

  async processAudioChunk(callSid: string, chunk: AudioChunk, retryCount = 0): Promise<SpeechRecognitionResult | null> {
    let streamData = this.streams.get(callSid);
    
    if (!streamData) {
      try {
        const stream = await this.createStream(callSid);
        streamData = this.streams.get(callSid)!;
      } catch (error) {
        console.error(`Failed to create stream for call ${callSid}:`, error);
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return this.processAudioChunk(callSid, chunk, retryCount + 1);
        }
        throw error;
      }
    }

    streamData.lastActivity = Date.now();

    return new Promise((resolve, reject) => {
      const responseHandler: ResponseHandler = (response: StreamingResponse) => {
        const result = response.results?.[0];
        if (result?.alternatives?.[0]) {
          const alternative = result.alternatives[0];
          resolve({
            text: alternative.transcript || '',
            isFinal: result.isFinal || false,
            confidence: alternative.confidence || 0
          });
        } else {
          resolve(null);
        }
      };

      // Add listener to the set
      streamData!.listeners.add(responseHandler);
      streamData!.stream.on('data', responseHandler);

      // Write the audio chunk to the stream
      try {
        streamData!.stream.write({
          audioContent: chunk.payload
        });
      } catch (error) {
        console.error(`Error writing to speech stream for call ${callSid}:`, error);
        streamData!.stream.removeListener('data', responseHandler);
        streamData!.listeners.delete(responseHandler);

        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            this.processAudioChunk(callSid, chunk, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, RETRY_DELAY);
        } else {
          reject(error);
        }
      }
    });
  }

  closeStream(callSid: string) {
    const streamData = this.streams.get(callSid);
    if (streamData) {
      try {
        // Remove all listeners
        streamData.listeners.clear();
        
        // End the stream
        streamData.stream.end();
        streamData.stream.removeAllListeners();
      } catch (error) {
        console.error(`Error closing speech stream for call ${callSid}:`, error);
      }
      this.streams.delete(callSid);
      console.log(`Closed speech stream for call ${callSid}`);
    }
  }

  // Helper method to detect silence/speech end
  detectSilence(audioData: Float32Array, threshold = 0.1): boolean {
    const sum = audioData.reduce((acc, val) => acc + Math.abs(val), 0);
    const average = sum / audioData.length;
    return average < threshold;
  }

  // Clean up resources when service is destroyed
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Close all active streams
    for (const [callSid] of this.streams) {
      this.closeStream(callSid);
    }
  }
}

export const speechRecognitionService = new SpeechRecognitionService();