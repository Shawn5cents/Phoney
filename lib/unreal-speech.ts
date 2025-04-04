const UNREAL_SPEECH_API_KEY = process.env.UNREAL_SPEECH_API_KEY!;
const UNREAL_SPEECH_API_URL = 'https://api.v8.unrealspeech.com/speech';

// American voices
type AmericanVoiceId = 
  // Female voices
  'Autumn' | 'Melody' | 'Hannah' | 'Emily' | 'Ivy' | 'Kaitlyn' | 'Luna' | 'Willow' | 'Lauren' | 'Sierra' |
  // Male voices
  'Noah' | 'Jasper' | 'Caleb' | 'Ronan' | 'Ethan' | 'Daniel' | 'Zane';

type VoiceId = AmericanVoiceId; // We'll stick to American voices for now

interface UnrealSpeechOptions {
  VoiceId?: VoiceId;
  Speed?: number; // -1.0 to 1.0
  Pitch?: number; // 0.5 to 1.5
  Bitrate?: '16k' | '32k' | '48k' | '64k' | '128k' | '192k' | '256k' | '320k';
  TimestampType?: 'word' | 'sentence';
}

export async function generateSpeech(
  text: string, 
  options: UnrealSpeechOptions = {}
): Promise<string> {
  try {
    console.log('Generating speech with Unreal Speech...');
    console.log('API Key:', UNREAL_SPEECH_API_KEY ? 'Present' : 'Missing');
    const response = await fetch(UNREAL_SPEECH_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNREAL_SPEECH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: options.VoiceId || 'Jasper', // Default to Jasper voice
        Speed: options.Speed || 0,
        Pitch: options.Pitch || 0.92, // Slightly lower pitch for male voice
        Bitrate: options.Bitrate || '192k',
        OutputFormat: 'uri',
        TimestampType: options.TimestampType || 'sentence'
      }),
    });

    if (!response.ok) {
      throw new Error(`Unreal Speech API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Unreal Speech response:', data);
    return data.OutputUri; // Return the audio URL directly
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

// Helper function to stream audio to Twilio
export async function streamToTwilio(audioData: string): Promise<string> {
  try {
    // Remove the data URL prefix and convert back to buffer
    const base64Data = audioData.replace(/^data:audio\/mp3;base64,/, '');
    const audioBuffer = Buffer.from(base64Data, 'base64');

    // For now, we'll return a data URL that Twilio can play
    // In production, you might want to stream this through a CDN or your own server
    return audioData;
  } catch (error) {
    console.error('Error streaming to Twilio:', error);
    throw error;
  }
}

export const voices = {
  MALE: ['Noah', 'Jasper', 'Caleb', 'Ronan', 'Ethan', 'Daniel', 'Zane'] as VoiceId[],
  FEMALE: ['Autumn', 'Melody', 'Hannah', 'Emily', 'Ivy', 'Kaitlyn', 'Luna', 'Willow', 'Lauren', 'Sierra'] as VoiceId[],
};
