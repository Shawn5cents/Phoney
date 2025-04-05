import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
import { Buffer } from 'buffer';

const SsmlVoiceGender = protos.google.cloud.texttospeech.v1.SsmlVoiceGender;

export interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

function mapGender(gender: 'MALE' | 'FEMALE' | 'NEUTRAL'): protos.google.cloud.texttospeech.v1.SsmlVoiceGender {
  switch (gender) {
    case 'MALE':
      return SsmlVoiceGender.MALE;
    case 'FEMALE':
      return SsmlVoiceGender.FEMALE;
    case 'NEUTRAL':
      return SsmlVoiceGender.NEUTRAL;
  }
}

export async function generateSpeech(text: string, voiceConfig: VoiceConfig): Promise<Buffer> {
  const client = new TextToSpeechClient();

  const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
    input: { text },
    voice: {
      languageCode: voiceConfig.languageCode,
      name: voiceConfig.name,
      ssmlGender: mapGender(voiceConfig.ssmlGender)
    },
    audioConfig: {
      audioEncoding: 'MP3',
      effectsProfileId: ['telephony-class-application'],
      pitch: 0,
      speakingRate: 1.0
    }
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    return Buffer.from(response.audioContent as Uint8Array);
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

export async function streamToTwilio(audioBuffer: Buffer): Promise<string> {
  // For development, we'll use a base64 data URL
  // In production, this should upload to cloud storage and return a public URL
  if (process.env.NODE_ENV === 'development') {
    return `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
  }

  // TODO: Implement cloud storage upload for production
  // This is a temporary solution - in production you should:
  // 1. Upload the audio buffer to cloud storage
  // 2. Return a public URL that Twilio can access
  // 3. Consider caching frequently used responses
  
  return `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
}

export function getVoiceOptions(personality: string = 'casual'): VoiceConfig {
  const voices = {
    casual: {
      languageCode: 'en-US',
      name: 'en-US-Studio-O',
      ssmlGender: 'FEMALE' as const
    },
    professional: {
      languageCode: 'en-US',
      name: 'en-US-Studio-M',
      ssmlGender: 'MALE' as const
    },
    friendly: {
      languageCode: 'en-US',
      name: 'en-US-Studio-G',
      ssmlGender: 'FEMALE' as const
    },
    expert: {
      languageCode: 'en-US',
      name: 'en-US-Studio-D',
      ssmlGender: 'MALE' as const
    }
  };

  return voices[personality as keyof typeof voices] || voices.casual;
}

// Helper function to add SSML markers for better speech quality
export function addSSMLMarkers(text: string): string {
  return `<speak>
    <prosody rate="1.0" pitch="0">
      ${text}
    </prosody>
  </speak>`;
}
