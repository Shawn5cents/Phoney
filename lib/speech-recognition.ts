import { SpeechClient, protos } from '@google-cloud/speech';
import { AudioChunk } from '../types/audio';

interface SpeechRecognitionResult {
  text: string;
  isFinal: boolean;
  confidence: number;
}

type SpeechRecognitionConfig = protos.google.cloud.speech.v1.IStreamingRecognitionConfig;
type StreamingResponse = protos.google.cloud.speech.v1.IStreamingRecognizeResponse;
type RecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig;
type RecognitionMetadata = protos.google.cloud.speech.v1.IRecognitionMetadata;

class SpeechRecognitionService {
  private client: SpeechClient;
  private streams: Map<string, any>;

  constructor() {
    this.client = new SpeechClient();
    this.streams = new Map();
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

    const recognizeStream = this.client.streamingRecognize(streamingConfig);

    // Set up error handling
    recognizeStream.on('error', (error: Error) => {
      console.error(`Speech recognition error for call ${callSid}:`, error);
      this.closeStream(callSid);
    });

    // Set up debug logging
    recognizeStream.on('response', (response: StreamingResponse) => {
      console.log(`Received speech response for call ${callSid}:`, 
        JSON.stringify(response, null, 2));
    });

    this.streams.set(callSid, recognizeStream);
    return recognizeStream;
  }

  async processAudioChunk(callSid: string, chunk: AudioChunk): Promise<SpeechRecognitionResult | null> {
    let stream = this.streams.get(callSid);
    
    if (!stream) {
      stream = await this.createStream(callSid);
    }

    return new Promise((resolve, reject) => {
      const responseHandler = (response: StreamingResponse) => {
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

      // Handle recognition results
      stream.on('data', responseHandler);

      // Write the audio chunk to the stream
      try {
        stream.write({
          audioContent: chunk.payload
        });
      } catch (error) {
        console.error(`Error writing to speech stream for call ${callSid}:`, error);
        stream.removeListener('data', responseHandler);
        reject(error);
      }
    });
  }

  closeStream(callSid: string) {
    const stream = this.streams.get(callSid);
    if (stream) {
      try {
        stream.end();
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
}

export const speechRecognitionService = new SpeechRecognitionService();