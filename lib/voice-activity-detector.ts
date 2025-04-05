import { VADResult } from '../types/audio';

export interface VADConfig {
  minSpeechFrames: number;
  silenceThreshold: number;
  maxBufferSize: number;
}

const DEFAULT_VAD_CONFIG: VADConfig = {
  minSpeechFrames: 10,
  silenceThreshold: 0.1,
  maxBufferSize: 50
};

/**
 * Detects voice activity in audio streams
 */
export class VoiceActivityDetector {
  private buffer: Float32Array[];
  private config: VADConfig;
  
  constructor(config: Partial<VADConfig> = {}) {
    this.buffer = [];
    this.config = { ...DEFAULT_VAD_CONFIG, ...config };
  }

  /**
   * Analyzes audio data for voice activity
   * @param audioData The audio data to analyze
   * @returns Voice activity detection result
   */
  analyze(audioData: Float32Array): VADResult {
    const energy = this.calculateEnergy(audioData);
    this.buffer.push(audioData);

    if (this.buffer.length > this.config.maxBufferSize) {
      this.buffer.shift();
    }

    const isSpeech = energy > this.config.silenceThreshold;
    const result: VADResult = {
      isSpeech,
      confidence: this.calculateConfidence(energy),
      startTime: Date.now()
    };

    return result;
  }

  /**
   * Calculates the energy level of the audio data
   * @param audioData The audio data to analyze
   * @returns The energy level
   */
  private calculateEnergy(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  /**
   * Calculates the confidence level of voice detection
   * @param energy The energy level
   * @returns Confidence value between 0 and 1
   */
  private calculateConfidence(energy: number): number {
    return Math.min(1, Math.max(0, energy / (this.config.silenceThreshold * 2)));
  }

  /**
   * Resets the detector's buffer
   */
  reset(): void {
    this.buffer = [];
  }
}
