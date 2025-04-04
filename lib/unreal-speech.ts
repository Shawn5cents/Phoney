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
  PersonalityType?: 'PROFESSIONAL' | 'FRIENDLY' | 'WITTY' | 'ZEN';
}

// Optimized voice settings for each personality type
const PERSONALITY_SETTINGS = {
  PROFESSIONAL: {
    MALE: {
      VoiceId: 'Jasper' as VoiceId,
      Speed: 0,        // Natural pace
      Pitch: 0.98,     // Very close to natural pitch
      Bitrate: '320k' as const  // Highest quality
    },
    FEMALE: {
      VoiceId: 'Melody' as VoiceId,
      Speed: 0,
      Pitch: 1.0,
      Bitrate: '320k' as const
    }
  },
  FRIENDLY: {
    MALE: {
      VoiceId: 'Noah' as VoiceId,
      Speed: 0.05,     // Slightly faster for friendly tone
      Pitch: 1.0,      // Natural pitch
      Bitrate: '320k' as const
    },
    FEMALE: {
      VoiceId: 'Hannah' as VoiceId,
      Speed: 0.05,
      Pitch: 1.02,     // Slightly higher for friendly tone
      Bitrate: '320k' as const
    }
  },
  WITTY: {
    MALE: {
      VoiceId: 'Ethan' as VoiceId,
      Speed: 0.1,      // Faster for witty responses
      Pitch: 1.03,     // Slightly higher for expressive tone
      Bitrate: '320k' as const
    },
    FEMALE: {
      VoiceId: 'Ivy' as VoiceId,
      Speed: 0.1,
      Pitch: 1.05,
      Bitrate: '320k' as const
    }
  },
  ZEN: {
    MALE: {
      VoiceId: 'Daniel' as VoiceId,
      Speed: -0.1,     // Slower for calming tone
      Pitch: 0.97,     // Slightly lower for calm tone
      Bitrate: '320k' as const
    },
    FEMALE: {
      VoiceId: 'Luna' as VoiceId,
      Speed: -0.1,
      Pitch: 0.98,
      Bitrate: '320k' as const
    }
  }
};

export async function generateSpeech(
  text: string, 
  options: UnrealSpeechOptions = {}
): Promise<string> {
  try {
    console.log('Generating speech with Unreal Speech...');
    console.log('API Key:', UNREAL_SPEECH_API_KEY ? 'Present' : 'Missing');
    
    // Apply personality settings if specified
    let finalOptions = { ...options };
    
    if (options.PersonalityType) {
      const gender = getGenderFromVoiceId(options.VoiceId) || 'MALE';
      const personalitySettings = PERSONALITY_SETTINGS[options.PersonalityType][gender];
      
      // Apply personality settings but allow overrides from options
      finalOptions = {
        ...personalitySettings,
        ...options,
      };
    }
    
    // Ensure we're using maximum quality settings
    const response = await fetch(UNREAL_SPEECH_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNREAL_SPEECH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: finalOptions.VoiceId || 'Jasper',
        Speed: finalOptions.Speed ?? 0,       // Use nullish coalescing to handle 0 value
        Pitch: finalOptions.Pitch || 0.98,    // Natural sounding pitch
        Bitrate: finalOptions.Bitrate || '320k', // Highest quality audio
        OutputFormat: 'uri',
        TimestampType: finalOptions.TimestampType || 'word' // Word-level timestamps for better control
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

// Helper function to determine gender from voice ID
function getGenderFromVoiceId(voiceId?: VoiceId): 'MALE' | 'FEMALE' | undefined {
  if (!voiceId) return undefined;
  
  if (voices.MALE.includes(voiceId)) {
    return 'MALE';
  } else if (voices.FEMALE.includes(voiceId)) {
    return 'FEMALE';
  }
  
  return undefined;
}

// Helper function to stream audio to Twilio
export async function streamToTwilio(audioData: string): Promise<string> {
  try {
    // Unreal Speech already returns URLs that Twilio can play
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
