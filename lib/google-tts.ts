import textToSpeech from '@google-cloud/text-to-speech';
import { Readable } from 'stream';

// Initialize the client with environment variables
const client = new textToSpeech.TextToSpeechClient();

export async function generateSpeech(text: string, gender: 'MALE' | 'FEMALE' = 'MALE'): Promise<string> {
  try {
    // Check if credentials are configured
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.warn('Google Cloud credentials not configured, using fallback TTS');
      throw new Error('Credentials not configured');
    }

    // Construct the request
    const request = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: gender === 'MALE' ? 'en-US-Neural2-D' : 'en-US-Neural2-F',
        ssmlGender: gender
      },
      audioConfig: { 
        audioEncoding: 'MP3' as const,
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0,
      },
    };

    // Generate speech
    const [response] = await client.synthesizeSpeech(request);
    if (!response.audioContent) {
      throw new Error('No audio content received');
    }

    // Convert to base64
    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
    return `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error generating speech:', error);
    // Return a URL to a default MP3 file
    return 'https://api.twilio.com/cowbell.mp3';
  }
}

// Helper function to stream audio to Twilio
export async function streamToTwilio(audioData: string): Promise<string> {
  try {
    // Remove the data URL prefix and convert back to buffer
    const base64Data = audioData.replace(/^data:audio\/mp3;base64,/, '');
    const audioBuffer = Buffer.from(base64Data, 'base64');

    // Create a readable stream from the buffer
    const stream = new Readable();
    stream.push(audioBuffer);
    stream.push(null);

    // Return the audio URL that Twilio can play
    // Note: In production, you'd upload this to cloud storage and return the URL
    // For now, we'll return a data URL that Twilio can handle
    return audioData;
  } catch (error) {
    console.error('Error streaming to Twilio:', error);
    throw error;
  }
}
