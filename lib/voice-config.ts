import { protos } from '@google-cloud/text-to-speech';

// Voice processing configuration constants
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
  },

  // Audio output settings
  audioOutput: {
    encoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
    effectsProfile: ['telephony-class-application']
  }
};

// Map of Google voice IDs to Twilio voice names
export const VOICE_MAPPING: Record<string, string> = {
  // Studio voices (higher quality)
  'en-US-Studio-O': 'woman',
  'en-US-Studio-M': 'man',
  'en-US-Studio-G': 'woman',
  'en-US-Studio-D': 'man',
  'en-US-Studio-A': 'woman',
  // Wavenet voices (fallback)
  'en-US-Wavenet-F': 'woman',
  'en-US-Wavenet-D': 'man',
  'en-US-Wavenet-A': 'woman',
  'en-US-Wavenet-B': 'man',
  'en-US-Wavenet-C': 'woman',
  'en-US-Wavenet-E': 'man',
  'en-US-Wavenet-J': 'woman'
};
