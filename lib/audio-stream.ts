import { WebSocket, WebSocketServer } from 'ws';
import { AudioChunk } from '../types/audio';
import { GeminiStream } from './gemini';
import { personalityStore } from './personality-store';
import { pusherServer } from './pusher';
import { speechRecognitionService } from './speech-recognition';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { StreamManager, StreamConfig } from './stream-manager';

/**
 * Handles WebSocket audio streams and real-time processing
 */
export class AudioStreamHandler {
  private wsServer: WebSocketServer;
  private streamManager: StreamManager;

  constructor(config: Partial<StreamConfig> = {}) {
    this.wsServer = new WebSocketServer({ noServer: true });
    this.streamManager = new StreamManager(config);
    this.setupWebSocketHandlers();
    this.startInactivityCheck();
  }

  private setupWebSocketHandlers() {
    this.wsServer.on('connection', async (ws: WebSocket, request: IncomingMessage) => {
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const callSid = url.searchParams.get('callSid');
      
      if (!callSid) {
        ws.close(1008, 'Missing callSid');
        return;
      }

      // Initialize stream
      const streamData = this.streamManager.createStream(callSid, ws);
      if (!streamData) {
        ws.close(1013, 'Maximum concurrent calls reached');
        return;
      }

      // Set up heartbeat
      const heartbeat = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        }
      }, 30000);

      ws.on('message', async (data: WebSocket.RawData) => {
        try {
          const streamData = this.streamManager.getStream(callSid);
          if (!streamData) return;

          this.streamManager.updateActivity(callSid);
          const chunk: AudioChunk = JSON.parse(data.toString());
          await this.processAudioChunk(chunk, ws);
        } catch (error) {
          console.error('Error processing audio chunk:', error);
          ws.send(JSON.stringify({ error: 'Failed to process audio' }));
        }
      });

      ws.on('close', () => {
        clearInterval(heartbeat);
        this.streamManager.cleanupStream(callSid);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for call ${callSid}:`, error);
        this.streamManager.cleanupStream(callSid);
      });

      ws.on('pong', () => {
        this.streamManager.updateActivity(callSid);
      });

      console.log(`WebSocket connection established for call ${callSid}`);
    });
  }

  private async processAudioChunk(chunk: AudioChunk, ws: WebSocket) {
    const streamData = this.streamManager.getStream(chunk.metadata.callSid);
    if (!streamData) return;

    const { vad, context } = streamData;
    
    // Convert audio data to Float32Array for VAD
    const audioData = new Float32Array(chunk.payload);
    const vadResult = vad.analyze(audioData);

    // Update real-time transcription if speech detected
    if (vadResult.isSpeech) {
      streamData.lastSpeechTime = Date.now();
      
      // Process through speech recognition
      try {
        const recognitionResult = await speechRecognitionService.processAudioChunk(
          chunk.metadata.callSid,
          chunk
        );

        if (recognitionResult) {
          await this.notifyPusher(chunk.metadata.callSid, 'speech.recognized', {
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
      } catch (error) {
        console.error('Speech recognition error:', error);
        await this.notifyPusher(chunk.metadata.callSid, 'speech.error', {
          error: 'Speech recognition failed',
          timestamp: Date.now()
        });
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

  private async notifyPusher(callSid: string, event: string, data: any) {
    try {
      await pusherServer.trigger(`call-${callSid}`, event, data);
    } catch (error) {
      console.error(`Pusher notification failed for ${event}:`, error);
    }
  }

  private async handleFinalTranscription(callSid: string, text: string, ws: WebSocket) {
    const streamData = this.streamManager.getStream(callSid);
    if (!streamData) return;

    const { context } = streamData;
    
    // Update conversation history with length limit
    context.history.push(`User: ${text}`);
    if (context.history.length > this.streamManager.maxHistoryLength) {
      context.history.shift();
    }

    // Get personality configuration
    const personality = personalityStore.getPersonality(context.personality);

    try {
      // Initialize AI stream if needed
      if (!streamData.aiStream) {
        streamData.aiStream = await GeminiStream.create({
          personality,
          context: context.history
        });
      }

      // Generate and stream AI response
      await streamData.aiStream.streamResponse(text, async (chunk) => {
        await this.notifyPusher(callSid, 'ai.response.partial', {
          text: chunk,
          timestamp: Date.now(),
          turnCount: context.turnCount
        });
      });

      context.turnCount++;
      
      await this.notifyPusher(callSid, 'ai.response.complete', {
        timestamp: Date.now(),
        turnCount: context.turnCount
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      await this.notifyPusher(callSid, 'ai.response.error', {
        error: 'Failed to generate response',
        timestamp: Date.now()
      });

      // Attempt to recreate AI stream on error
      if (streamData.aiStream) {
        streamData.aiStream.close();
        streamData.aiStream = null;
      }
    }
  }

  private cleanupStream(callSid: string) {
    const streamData = this.streamManager.getStream(callSid);
    if (streamData) {
      if (streamData.aiStream) {
        streamData.aiStream.close();
      }
      if (streamData.ws.readyState === WebSocket.OPEN) {
        streamData.ws.close();
      }
      speechRecognitionService.closeStream(callSid);
      this.streamManager.cleanupStream(callSid);
      console.log(`Cleaned up stream for call ${callSid}`);
    }
  }

  private startInactivityCheck() {
    setInterval(() => {
      for (const callSid of this.streamManager.getActiveStreamIds()) {
        if (this.streamManager.isInactive(callSid)) {
          console.log(`Closing inactive stream for call ${callSid}`);
          this.streamManager.cleanupStream(callSid);
        }
      }
    }, 60000); // Check every minute
  }

  public handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer) {
    this.wsServer.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      this.wsServer.emit('connection', ws, request);
    });
  }
}

export const audioStreamHandler = new AudioStreamHandler();