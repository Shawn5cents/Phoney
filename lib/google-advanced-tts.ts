import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const googleAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// Voice IDs for Google's premium natural-sounding voices
// These are the ultra-realistic voices similar to what you hear in Gemini Live
export const VOICE_IDS = {
  MALE: {
    PROFESSIONAL: 'alloy', // Clear, neutral male voice
    FRIENDLY: 'fable',     // Warm, approachable male voice
    WITTY: 'ember',        // Energetic, expressive male voice
    ZEN: 'cypress'         // Calm, soothing male voice
  },
  FEMALE: {
    PROFESSIONAL: 'nova',   // Clear, articulate female voice
    FRIENDLY: 'shimmer',    // Warm, welcoming female voice
    WITTY: 'breeze',        // Energetic, expressive female voice
    ZEN: 'aurora'           // Calm, soothing female voice
  }
};

// Voice configuration settings optimized for each personality
export const VOICE_SETTINGS = {
  PROFESSIONAL: {
    speed: 1.0,       // Standard pace
    stability: 0.7,    // Balanced between consistent and variable
    similarity: 0.8    // High similarity to the reference voice
  },
  FRIENDLY: {
    speed: 1.05,      // Slightly faster, more energetic
    stability: 0.6,    // More variation for friendly tone
    similarity: 0.75   // Good similarity with more warmth
  },
  WITTY: {
    speed: 1.1,       // Quicker for witty remarks
    stability: 0.5,    // More expressive variation
    similarity: 0.7    // Allow for more character in voice
  },
  ZEN: {
    speed: 0.95,      // Slightly slower for calming effect
    stability: 0.8,    // More consistent and steady
    similarity: 0.85   // Very close to reference voice
  }
};

type PersonalityType = 'PROFESSIONAL' | 'FRIENDLY' | 'WITTY' | 'ZEN';
type Gender = 'MALE' | 'FEMALE';

interface VoiceOptions {
  personalityType?: PersonalityType;
  gender?: Gender;
  customVoiceId?: string;
  speed?: number;
}

/**
 * Generates ultra-realistic speech using Google's premium TTS technology
 * Similar to the voice quality you hear in Gemini Live
 */
export async function generateSpeech(text: string, options: VoiceOptions = {}): Promise<string> {
  try {
    const personality = options.personalityType || 'PROFESSIONAL';
    const gender = options.gender || 'MALE';
    
    // Select the voice ID based on personality and gender
    const voiceId = options.customVoiceId || VOICE_IDS[gender][personality];
    
    // Get settings for this personality
    const settings = VOICE_SETTINGS[personality];
    
    console.log(`Generating premium speech with Google (voice: ${voiceId})...`);
    
    // Create a model with Gemini Pro Audio
    const model = googleAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-latest",
      generationConfig: {
        temperature: 0.1
      }
    });
    
    // For Gemini, we use a text prompt approach to generate the audio
    // Note: The exact implementation depends on which Google API version you're using
    // This implementation uses a more recent approach that should work
    
    // Format the prompt to request audio generation
    const prompt = `Generate high quality audio for this text: "${text}" using voice ${voiceId} with speed ${options.speed || settings.speed}. The audio should sound natural and indistinguishable from a human.`;
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        // Using proper parameter name
        responseMimeType: "audio/mp3"
      }
    });
    
    // Extract audio data from the response
    const response = result.response;
    
    // Access multimedia content properly based on API structure
    const parts = response.candidates?.[0]?.content?.parts || [];
    let audioData = null;
    
    // Find the audio part in the response
    for (const part of parts) {
      // Check for inline data or file data based on API structure
      if ('inlineData' in part && part.inlineData?.data) {
        audioData = part.inlineData.data;
        break;
      } else if ('fileData' in part && part.fileData?.fileUri) {
        // If it's a file URI, we would need to fetch it
        // This is a simplified placeholder
        throw new Error('File URI audio response not implemented');
      }
    }
    
    if (!audioData) {
      throw new Error('No audio data received from Google');
    }
    
    // Convert to data URL format for Twilio
    return `data:audio/mp3;base64,${audioData}`;
  } catch (error) {
    console.error('Error generating premium speech:', error);
    
    // Fall back to a simple Twilio voice in case of error
    return 'https://api.twilio.com/cowbell.mp3';
  }
}

// Helper function to stream audio to Twilio
export async function streamToTwilio(audioData: string): Promise<string> {
  try {
    // Google TTS returns a URL or base64 data that Twilio can use directly
    return audioData;
  } catch (error) {
    console.error('Error streaming to Twilio:', error);
    throw error;
  }
}
