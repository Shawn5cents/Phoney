import OpenAI from 'openai';
import { VoiceConfig } from '../types/voice';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcribe speech from audio using OpenAI's speech-to-text
 * @param audioBuffer Audio buffer to transcribe
 * @returns Transcription text or empty string if error
 */
export async function transcribeSpeech(audioBuffer: Buffer): Promise<string> {
  if (!audioBuffer || audioBuffer.length === 0) {
    console.warn('Empty audio buffer provided to transcribeSpeech');
    return '';
  }

  try {
    const response = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.wav', { type: 'audio/wav' }),
      model: 'gpt-4o-transcribe',
      language: 'en',
      response_format: 'text',
    });

    return response;
  } catch (error) {
    console.error('Error transcribing speech:', error);
    return '';
  }
}

/**
 * Generate speech from text using OpenAI's text-to-speech
 * @param text The text to convert to speech
 * @param voiceConfig Voice configuration from AI personality
 * @returns Audio buffer or null if error
 */
export async function generateSpeech(text: string, voiceConfig: VoiceConfig): Promise<Buffer | null> {
  if (!text || text.trim() === '') {
    console.warn('Empty text provided to generateSpeech');
    return null;
  }

  try {
    const response = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: mapVoiceToOpenAI(voiceConfig),
      input: text,
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error generating speech:', error);
    return null;
  }
}

/**
 * Map our voice config to OpenAI voice options
 */
function mapVoiceToOpenAI(voiceConfig: VoiceConfig): 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' {
  // Map SSML gender and voice name to OpenAI voices
  switch (voiceConfig.ssmlGender) {
    case 'MALE':
      return 'onyx'; // Deep, male voice
    case 'FEMALE':
      return 'nova'; // Clear, female voice
    case 'NEUTRAL':
      return 'alloy'; // Neutral voice
    default:
      return 'alloy';
  }
}

// Export singleton instance
export const openAISpeech = {
  transcribeSpeech,
  generateSpeech,
};
