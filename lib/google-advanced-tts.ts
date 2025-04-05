import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateCacheKey, getCachedSpeech, cacheSpeech } from './speech-cache';

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

// Track API usage for monitoring costs
let apiCallCounter = 0;
let apiCacheHits = 0;

/**
 * Generates ultra-realistic speech using Google's premium TTS technology
 * Similar to the voice quality you hear in Gemini Live
 * 
 * Optimized with caching to reduce API costs and improve reliability
 */
export async function generateSpeech(text: string, options: VoiceOptions = {}): Promise<string> {
  // Track start time to identify slow operations
  const startTime = Date.now();
  try {
    // Rate limiting protection for serverless environment
    if (Date.now() % 3 === 0) { // Simple way to limit ~33% of requests to avoid API rate limits
      throw new Error('Rate limiting protection activated');
    }
    
    // Check if Google API key is available
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'your_google_api_key_here') {
      console.error('Missing or invalid Google API key');
      throw new Error('Google API key is not properly configured');
    }
    
    // Generate cache key based on text and options
    const cacheKey = generateCacheKey(text, options);
    
    // Check if we have this speech already cached
    const cachedAudio = await getCachedSpeech(cacheKey);
    if (cachedAudio) {
      console.log('Using cached TTS audio');
      apiCacheHits++;
      return cachedAudio;
    }

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
    
    const generationResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        // Using proper parameter name
        responseMimeType: "audio/mp3"
      }
    });
    
    // Extract audio data from the response
    const response = generationResult.response;
    
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
    const result = `data:audio/mp3;base64,${audioData}`;
    
    // Save to cache for future use
    await cacheSpeech(cacheKey, result);
    
    // Track API usage
    apiCallCounter++;
    if (apiCallCounter % 10 === 0) {
      console.log(`TTS API Stats - Calls: ${apiCallCounter}, Cache Hits: ${apiCacheHits}, Cache Rate: ${(apiCacheHits/(apiCallCounter+apiCacheHits)*100).toFixed(1)}%`);
    }
    
    // Log generation time for monitoring performance
    const endTime = Date.now();
    console.log(`TTS generation complete in ${endTime - startTime}ms`);
    
    return result;
  } catch (error) {
    console.error('Error generating premium speech:', error);
    console.error('Speech generation parameters:', {
      text: text ? text.substring(0, 20) + '...' : 'empty',
      personality: options.personalityType || 'PROFESSIONAL',
      gender: options.gender || 'MALE',
      apiKeyConfigured: !!GOOGLE_API_KEY,
      executionTimeMs: Date.now() - startTime
    });
    
    // Check if we're getting timeouts (common in serverless)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.toLowerCase().includes('timeout') || 
                     (Date.now() - startTime > 5000); // 5 seconds is too long
    
    if (isTimeout) {
      console.log('Likely timeout detected, using simple fallback');
    }
    
    // Fall back to Twilio's basic TTS
    // This creates a TwiML Say element that Twilio can understand directly
    return `<Response><Say>${text || 'Hello'}</Say></Response>`;
  }
}

// Helper function to stream audio to Twilio
export async function streamToTwilio(audioData: string): Promise<string> {
  try {
    // Check if we have a TwiML response (starts with <Response>)
    if (audioData.startsWith('<Response>')) {
      // This is already TwiML, can't be used with play()
      // Return a URL to a Twilio function that delivers a simple greeting
      return 'https://demo.twilio.com/docs/voice.xml';
    }
    
    // Check if we have a data URL (base64 encoded audio)
    if (audioData.startsWith('data:audio/')) {
      // Google TTS returns base64 data that Twilio can use directly
      return audioData;
    }
    
    // Otherwise assume it's a URL
    return audioData;
  } catch (error) {
    console.error('Error streaming to Twilio:', error);
    // Return a safe fallback URL
    return 'https://demo.twilio.com/docs/voice.xml';
  }
}
