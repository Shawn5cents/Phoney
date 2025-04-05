import { WebSocket, WebSocketServer } from 'ws';
import { AudioChunk, AudioStreamOptions, VADResult, ConversationContext } from '../types/audio';
import { GeminiStream } from './gemini';
import { personalityStore } from './personality-store';
import { pusherServer } from './pusher';
import { speechRecognitionService } from './speech-recognition';
import { IncomingMessage } from 'http';
import { Socket } from 'net';

class VoiceActivityDetector {
  private buffer: Float32Array[];
  private minSpeechFrames: number = 10;
  private silenceThreshold: number = 0.1;
  
  constructor() {
    this.buffer = [];
  }

  analyze(audioData: Float32Array): VADResult {
    const energy = this.calculateEnergy(audioData);
    this.buffer.push(audioData);

    if (this.buffer.length > 50) {
      this.buffer.shift();
    }

    const isSpeech = energy > this.silenceThreshold;
    const result: VADResult = {
      isSpeech,
      confidence: this.calculateConfidence(energy),
      startTime: Date.now()
    };

    return result;
  }

  private calculateEnergy(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  private calculateConfidence(energy: number): number {
    return Math.min(1, Math.max(0, energy / (this.silenceThreshold * 2)));
  }

  reset() {
    this.buffer = [];
  }
}

export class AudioStreamHandler {
  private wsServer: WebSocketServer;
  private activeStreams: Map<string, {
    vad: VoiceActivityDetector;
    context: ConversationContext;
    aiStream: GeminiStream | null;
    lastSpeechTime: number;
  }>;

  constructor() {
    this.wsServer = new WebSocketServer({ noServer: true });
    this.activeStreams = new Map();
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers() {
    this.wsServer.on('connection', async (ws: WebSocket, request: IncomingMessage) => {
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const callSid = url.searchParams.get('callSid');
      
      if (!callSid) {
        ws.close(1008, 'Missing callSid');
        return;
      }

      // Initialize stream context
      this.activeStreams.set(callSid, {
        vad: new VoiceActivityDetector(),
        context: {
          history: [],
          currentSpeech: '',
          lastResponse: '',
          personality: 'professional', // Default personality
          startTime: Date.now(),
          turnCount: 0
        },
        aiStream: null,
        lastSpeechTime: Date.now()
      });

      ws.on('message', async (data: WebSocket.RawData) => {
        try {
          const chunk: AudioChunk = JSON.parse(data.toString());
          await this.processAudioChunk(chunk, ws);
        } catch (error) {
          console.error('Error processing audio chunk:', error);
          ws.send(JSON.stringify({ error: 'Failed to process audio' }));
        }
      });

      ws.on('close', () => {
        this.cleanupStream(callSid);
      });

      console.log(`WebSocket connection established for call ${callSid}`);
    });
  }

  private async processAudioChunk(chunk: AudioChunk, ws: WebSocket) {
    const streamData = this.activeStreams.get(chunk.metadata.callSid);
    if (!streamData) return;

    const { vad, context } = streamData;
    
    // Convert audio data to Float32Array for VAD
    const audioData = new Float32Array(chunk.payload);
    const vadResult = vad.analyze(audioData);

    // Update real-time transcription if speech detected
    if (vadResult.isSpeech) {
      streamData.lastSpeechTime = Date.now();
      
      // Process through speech recognition
      const recognitionResult = await speechRecognitionService.processAudioChunk(
        chunk.metadata.callSid,
        chunk
      );

      if (recognitionResult) {
        await pusherServer.trigger(`call-${chunk.metadata.callSid}`, 'speech.recognized', {
          text: recognitionResult.text,
          isFinal: recognitionResult.isFinal,
          confidence: recognitionResult.confidence,
          timestamp: Date.now()
        });

        if (recognitionResult.isFinal) {
          await this.handleFinalTranscription(
            chunk.metadata.callSid,
            recognitionResult.text,
            ws
          );
        }
      }
    } else {
      // Check for end of speech after silence threshold
      const silenceDuration = Date.now() - streamData.lastSpeechTime;
      if (silenceDuration > 1000 && context.currentSpeech) {
        await this.handleFinalTranscription(
          chunk.metadata.callSid,
          context.currentSpeech,
          ws
        );
        context.currentSpeech = '';
      }
    }
  }

  private async handleFinalTranscription(callSid: string, text: string, ws: WebSocket) {
    const streamData = this.activeStreams.get(callSid);
    if (!streamData) return;

    const { context } = streamData;
    
    // Update conversation history
    context.history.push(`User: ${text}`);
    if (context.history.length > 10) context.history.shift();

    // Get personality configuration
    const personality = personalityStore.getPersonality(context.personality);

    // Initialize AI stream if needed
    if (!streamData.aiStream) {
      streamData.aiStream = await GeminiStream.create({
        personality,
        context: context.history
      });
    }

    // Generate and stream AI response
    try {
      await streamData.aiStream.streamResponse(text, async (chunk) => {
        // Send partial response to client
        await pusherServer.trigger(`call-${callSid}`, 'ai.response.partial', {
          text: chunk,
          timestamp: Date.now(),
          turnCount: context.turnCount
        });
      });

      context.turnCount++;
      
      // Final response notification
      await pusherServer.trigger(`call-${callSid}`, 'ai.response.complete', {
        timestamp: Date.now(),
        turnCount: context.turnCount
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      await pusherServer.trigger(`call-${callSid}`, 'ai.response.error', {
        error: 'Failed to generate response',
        timestamp: Date.now()
      });
    }
  }

  private cleanupStream(callSid: string) {
    const streamData = this.activeStreams.get(callSid);
    if (streamData?.aiStream) {
      streamData.aiStream.close();
    }
    speechRecognitionService.closeStream(callSid);
    this.activeStreams.delete(callSid);
    console.log(`Cleaned up stream for call ${callSid}`);
  }

  public handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer) {
    this.wsServer.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      this.wsServer.emit('connection', ws, request);
    });
  }
}

export const audioStreamHandler = new AudioStreamHandler();