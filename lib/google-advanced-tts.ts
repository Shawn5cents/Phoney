import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
import { Buffer } from 'buffer';
import { SayVoice } from 'twilio/lib/twiml/VoiceResponse';

interface VoiceOptions {
  languageCode: string;
  name: SayVoice;
  ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  customVoice?: {
    model: string;
    reportedUsage?: 'REPORTED_USAGE_UNSPECIFIED' | 'REALTIME' | 'OFFLINE';
  };
}

export async function generateSpeech(text: string, voiceOptions: VoiceOptions): Promise<Buffer> {
  const client = new TextToSpeechClient();

  const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
    input: { text },
    voice: {
      languageCode: voiceOptions.languageCode,
      name: voiceOptions.name,
      ssmlGender: voiceOptions.ssmlGender
    },
    audioConfig: {
      audioEncoding: 'MP3',
      effectsProfileId: ['telephony-class-application']
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
  // In a real implementation, this would stream to a publicly accessible URL
  // For now, we'll use a base64 data URL
  return `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
}

export function getVoiceOptions(personality: string): VoiceOptions {
  switch (personality) {
    case 'professional':
      return {
        languageCode: 'en-US',
        name: 'en-US-Neural2-D' as SayVoice,
        ssmlGender: 'MALE'
      };
    case 'friendly':
      return {
        languageCode: 'en-US',
        name: 'en-US-Neural2-C' as SayVoice,
        ssmlGender: 'FEMALE'
      };
    case 'witty':
      return {
        languageCode: 'en-US',
        name: 'en-US-Neural2-F' as SayVoice,
        ssmlGender: 'FEMALE'
      };
    case 'zen':
      return {
        languageCode: 'en-US',
        name: 'en-US-Neural2-A' as SayVoice,
        ssmlGender: 'MALE'
      };
    default:
      return {
        languageCode: 'en-US',
        name: 'en-US-Neural2-D' as SayVoice,
        ssmlGender: 'MALE'
      };
  }
}
