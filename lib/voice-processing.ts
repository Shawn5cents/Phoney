import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import { protos } from '@google-cloud/text-to-speech';

// Define interfaces to match the AI personality structure from personality-store.ts
export interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  speakingRate?: number;
  pitch?: number;
}

// Interface to match the AIPersonalityConfig from personality-store.ts
export interface AIPersonalityConfig {
  name: string;
  systemPrompt: string;
  voiceId: string;
  voiceConfig: VoiceConfig;
  traits: string[];
  temperature?: number;
  examples?: { input: string; response: string }[];
}

// Initialize Google Cloud clients
const textToSpeechClient = new TextToSpeechClient();
const speechClient = new SpeechClient();

// Map of Google voice IDs to Twilio voice names
const VOICE_MAPPING: Record<string, string> = {
  'en-US-Studio-O': 'woman',
  'en-US-Studio-M': 'man',
  'en-US-Studio-G': 'woman',
  'en-US-Wavenet-F': 'woman',
  'en-US-Wavenet-D': 'man',
  'en-US-Wavenet-A': 'woman',
  'en-US-Wavenet-B': 'man',
  'en-US-Wavenet-C': 'woman',
  'en-US-Wavenet-E': 'man',
  'en-US-Wavenet-J': 'woman'
};

// Voice processing configuration
export const voiceProcessingConfig = {
  // Default voice settings if not specified
  defaultVoice: {
    languageCode: 'en-US',
    name: 'en-US-Studio-O',
    ssmlGender: 'FEMALE' as const
  },
  
  // Speech recognition settings
  speechRecognition: {
    encoding: 'LINEAR16' as const,
    sampleRateHertz: 8000,
    languageCode: 'en-US',
    model: 'phone_call',
    useEnhanced: true
  }
};

/**
 * Generate speech from text using Google Text-to-Speech
 * @param text The text to convert to speech
 * @param voiceConfig Voice configuration from AI personality
 * @returns Audio buffer
 */
export async function generateSpeech(text: string, voiceConfig: VoiceConfig): Promise<Buffer> {
  try {
    // Define proper types for the request
    const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
      input: { text },
      voice: {
        languageCode: voiceConfig.languageCode || 'en-US',
        name: voiceConfig.name || voiceProcessingConfig.defaultVoice.name,
        ssmlGender: getSsmlGender(voiceConfig.ssmlGender) || getSsmlGender(voiceProcessingConfig.defaultVoice.ssmlGender)
      },
      audioConfig: {
        audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
        effectsProfileId: ['telephony-class-application']
      },
    };

    const [response] = await textToSpeechClient.synthesizeSpeech(request);
    return Buffer.from(response.audioContent as Uint8Array);
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

/**
 * Transcribe speech from audio using Google Speech-to-Text
 * @param audioBuffer Audio buffer to transcribe
 * @returns Transcription text
 */
export async function transcribeSpeech(audioBuffer: Buffer): Promise<string> {
  try {
    const audio = {
      content: audioBuffer.toString('base64'),
    };
    
    // Create properly typed config
    const config = {
      encoding: voiceProcessingConfig.speechRecognition.encoding,
      sampleRateHertz: voiceProcessingConfig.speechRecognition.sampleRateHertz,
      languageCode: voiceProcessingConfig.speechRecognition.languageCode,
      useEnhanced: true,
      model: 'phone_call',
    };

    const request = {
      audio,
      config,
    };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      ?.map((result: any) => result.alternatives?.[0]?.transcript)
      .filter(Boolean)
      .join('\n');
    
    return transcription || '';
  } catch (error) {
    console.error('Error transcribing speech:', error);
    throw error;
  }
}

/**
 * Format text for SSML to improve speech quality
 * @param text Plain text to format
 * @returns SSML formatted text
 */
export function formatSSML(text: string): string {
  // Add pauses at punctuation
  let ssml = text
    .replace(/\./g, '.<break time="500ms"/>')
    .replace(/\?/g, '?<break time="500ms"/>')
    .replace(/\!/g, '!<break time="500ms"/>')
    .replace(/,/g, ',<break time="200ms"/>');
  
  // Wrap in SSML tags
  return `<speak>${ssml}</speak>`;
}

/**
 * Helper function to convert string gender to SSML gender enum
 */
function getSsmlGender(gender?: string): protos.google.cloud.texttospeech.v1.SsmlVoiceGender {
  if (gender === 'MALE') {
    return protos.google.cloud.texttospeech.v1.SsmlVoiceGender.MALE;
  } else if (gender === 'NEUTRAL') {
    return protos.google.cloud.texttospeech.v1.SsmlVoiceGender.NEUTRAL;
  } else {
    // Default to FEMALE
    return protos.google.cloud.texttospeech.v1.SsmlVoiceGender.FEMALE;
  }
}

/**
 * Get voice configuration for Twilio TwiML
 * @param voiceConfig Voice configuration from AI personality
 * @returns Voice configuration for Twilio
 */
export function getTwilioVoiceConfig(voiceConfig: VoiceConfig | undefined): any {
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
  // Return the voice config directly
  return personality.voiceConfig;
}
