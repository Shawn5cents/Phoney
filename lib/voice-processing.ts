import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient, protos as speechProtos } from '@google-cloud/speech';
import { protos as ttsProtos } from '@google-cloud/text-to-speech';

// Type definitions for voice configuration
export interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  speakingRate?: number;
  pitch?: number;
}

// Type definition for AI personality configuration
export interface AIPersonalityConfig {
  name: string;
  systemPrompt: string;
  voiceId: string;
  voiceConfig: VoiceConfig;
  traits: string[];
  temperature?: number;
  examples?: { input: string; response: string }[];
}

// Type for Twilio voice configuration
export interface TwilioVoiceConfig {
  voice: string;
  language: string;
}

// Initialize Google Cloud clients with proper error handling
class GoogleCloudClients {
  private static instance: GoogleCloudClients;
  private _textToSpeechClient: TextToSpeechClient | null = null;
  private _speechClient: SpeechClient | null = null;

  private constructor() {
    try {
      this._textToSpeechClient = new TextToSpeechClient();
      this._speechClient = new SpeechClient();
    } catch (error) {
      console.error('Failed to initialize Google Cloud clients:', error);
    }
  }

  static getInstance(): GoogleCloudClients {
    if (!GoogleCloudClients.instance) {
      GoogleCloudClients.instance = new GoogleCloudClients();
    }
    return GoogleCloudClients.instance;
  }

  get textToSpeechClient(): TextToSpeechClient | null {
    return this._textToSpeechClient;
  }

  get speechClient(): SpeechClient | null {
    return this._speechClient;
  }
}

const clients = GoogleCloudClients.getInstance();

import { VOICE_MAPPING, voiceProcessingConfig } from './voice-config';

/**
 * Generate speech from text using Google Text-to-Speech
 * @param text The text to convert to speech
 * @param voiceConfig Voice configuration from AI personality
 * @returns Audio buffer or null if error
 */
export async function generateSpeech(text: string, voiceConfig: VoiceConfig): Promise<Buffer | null> {
  const ttsClient = clients.textToSpeechClient;
  if (!ttsClient) {
    console.error('Text-to-speech client not initialized');
    return null;
  }

  if (!text || text.trim() === '') {
    console.warn('Empty text provided to generateSpeech');
    return null;
  }

  try {
    // Define request with proper types
    const request: ttsProtos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
      input: { text },
      voice: {
        languageCode: voiceConfig.languageCode || voiceProcessingConfig.defaultVoice.languageCode,
        name: voiceConfig.name || voiceProcessingConfig.defaultVoice.name,
        ssmlGender: getSsmlGender(voiceConfig.ssmlGender)
      },
      audioConfig: {
        audioEncoding: voiceProcessingConfig.audioOutput.encoding,
        effectsProfileId: voiceProcessingConfig.audioOutput.effectsProfile,
        speakingRate: voiceConfig.speakingRate,
        pitch: voiceConfig.pitch
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    
    if (!response.audioContent) {
      throw new Error('No audio content returned from Google TTS');
    }
    
    return Buffer.from(response.audioContent as Uint8Array);
  } catch (error) {
    console.error('Error generating speech:', error);
    return null;
  }
}

/**
 * Transcribe speech from audio using Google Speech-to-Text
 * @param audioBuffer Audio buffer to transcribe
 * @returns Transcription text or empty string if error
 */
export async function transcribeSpeech(audioBuffer: Buffer): Promise<string> {
  const sttClient = clients.speechClient;
  if (!sttClient) {
    console.error('Speech client not initialized');
    return '';
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    console.warn('Empty audio buffer provided to transcribeSpeech');
    return '';
  }

  try {
    const audio = {
      content: audioBuffer.toString('base64'),
    };
    
    // Create properly typed config
    const config = {
      encoding: voiceProcessingConfig.speechRecognition.encoding,
      sampleRateHertz: voiceProcessingConfig.speechRecognition.sampleRateHertz,
      languageCode: voiceProcessingConfig.speechRecognition.languageCode,
      useEnhanced: voiceProcessingConfig.speechRecognition.useEnhanced,
      model: voiceProcessingConfig.speechRecognition.model,
    };

    const request = { audio, config };

    const [response] = await sttClient.recognize(request);
    
    if (!response.results || response.results.length === 0) {
      return '';
    }
    
    const transcription = response.results
      .map((result: speechProtos.google.cloud.speech.v1.ISpeechRecognitionResult) => result.alternatives?.[0]?.transcript || '')
      .filter((text: string) => text.trim() !== '')
      .join('\n');
    
    return transcription;
  } catch (error) {
    console.error('Error transcribing speech:', error);
    return '';
  }
}

/**
 * Format text for SSML to improve speech quality
 * @param text Plain text to format
 * @returns SSML formatted text
 */
export function formatSSML(text: string): string {
  if (!text) return '<speak></speak>';
  
  // Escape XML special characters
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  
  // Add pauses at punctuation for more natural speech
  const ssml = escaped
    .replace(/\./g, '.<break time="500ms"/>')
    .replace(/\?/g, '?<break time="500ms"/>')
    .replace(/\!/g, '!<break time="500ms"/>')
    .replace(/,/g, ',<break time="200ms"/>');
  
  // Wrap in SSML tags
  return `<speak>${ssml}</speak>`;
}

/**
 * Helper function to convert string gender to SSML gender enum
 * @param gender The gender string
 * @returns The corresponding SSML gender enum value
 */
function getSsmlGender(gender?: string): ttsProtos.google.cloud.texttospeech.v1.SsmlVoiceGender {
  const SsmlVoiceGender = ttsProtos.google.cloud.texttospeech.v1.SsmlVoiceGender;
  
  switch (gender) {
    case 'MALE':
      return SsmlVoiceGender.MALE;
    case 'NEUTRAL':
      return SsmlVoiceGender.NEUTRAL;
    case 'FEMALE':
      return SsmlVoiceGender.FEMALE;
    default:
      return SsmlVoiceGender.FEMALE; // Default to FEMALE
  }
}

/**
 * Get voice configuration for Twilio TwiML
 * @param voiceConfig Voice configuration from AI personality
 * @returns Voice configuration for Twilio
 */
export function getTwilioVoiceConfig(voiceConfig: VoiceConfig | undefined): TwilioVoiceConfig {
  if (!voiceConfig) {
    return { voice: 'woman', language: 'en-US' };
  }
  
  // Get the appropriate Twilio voice based on the Google voice name
  const voiceName = voiceConfig.name || '';
  const twilioVoice = VOICE_MAPPING[voiceName] || 'woman';
  
  return {
    voice: twilioVoice,
    language: voiceConfig.languageCode || 'en-US'
  };
}

/**
 * Get voice configuration from a personality
 * @param personality AI personality
 * @returns Voice configuration
 */
export function getVoiceConfigFromPersonality(personality: AIPersonalityConfig): VoiceConfig {
  if (!personality || !personality.voiceConfig) {
    return voiceProcessingConfig.defaultVoice;
  }
  return personality.voiceConfig;
}
