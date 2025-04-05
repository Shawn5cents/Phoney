import { GoogleGenerativeAI } from '@google/generative-ai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { generateCacheKey, getCachedSpeech, cacheSpeech } from './filesystem-cache';

// Initialize the Google AI client for Gemini
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const googleAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// Initialize the dedicated TTS client
const ttsClient = new TextToSpeechClient();

// Voice IDs for Google's premium natural-sounding voices
export const VOICE_IDS = {
  MALE: {
    PROFESSIONAL: 'en-US-Neural2-J', // Clear, professional male voice
    FRIENDLY: 'en-US-Neural2-D',     // Warm, approachable male voice
    WITTY: 'en-US-Neural2-I',        // Energetic, expressive male voice
    ZEN: 'en-US-Neural2-A'           // Calm, soothing male voice
  },
  FEMALE: {
    PROFESSIONAL: 'en-US-Neural2-F',   // Clear, articulate female voice
    FRIENDLY: 'en-US-Neural2-E',       // Warm, welcoming female voice
    WITTY: 'en-US-Neural2-C',          // Energetic, expressive female voice
    ZEN: 'en-US-Neural2-G'             // Calm, soothing female voice
  }
};

// Voice configuration settings optimized for each personality
export const VOICE_SETTINGS = {
  PROFESSIONAL: {
    speed: 1.0,       // Standard pace
    pitch: 0.0,       // Neutral pitch
    volumeGainDb: 0.0 // Standard volume
  },
  FRIENDLY: {
    speed: 1.05,      // Slightly faster, more energetic
    pitch: 1.0,       // Slightly higher pitch for friendliness
    volumeGainDb: 1.0 // Slightly louder
  },
  WITTY: {
    speed: 1.1,       // Quicker for witty remarks
    pitch: 2.0,       // Higher variation for expressiveness
    volumeGainDb: 2.0 // Louder for impact
  },
  ZEN: {
    speed: 0.95,      // Slightly slower for calming effect
    pitch: -1.0,      // Slightly lower pitch for calming effect
    volumeGainDb: -1.0 // Slightly softer
  }
};

// Track API usage stats for monitoring
let apiCallCounter = 0;
let apiCacheHits = 0;

type PersonalityType = 'PROFESSIONAL' | 'FRIENDLY' | 'WITTY' | 'ZEN';
type Gender = 'MALE' | 'FEMALE';

interface VoiceOptions {
  personalityType?: PersonalityType;
  gender?: Gender;
  customVoiceId?: string;
  speed?: number;
  pitch?: number;
  volumeGainDb?: number;
}

/**
 * Generates speech using Google's Cloud Text-to-Speech API
 * Optimized with cloud storage caching to reduce API costs
 */
export async function generateSpeech(text: string, options: VoiceOptions = {}): Promise<string> {
  // Track start time for monitoring
  const startTime = Date.now();
  
  try {
    // Check if API key is configured
    if (!GOOGLE_API_KEY) {
      console.error('Missing Google API key');
      throw new Error('Google API key is not configured');
    }
    
    // Generate cache key based on text and voice options
    const cacheKey = generateCacheKey(text, options);
    
    // Check if we have this speech already cached
    const cachedAudio = await getCachedSpeech(cacheKey);
    if (cachedAudio) {
      console.log('Using cached TTS audio');
      apiCacheHits++;
      
      // Log usage stats periodically
      if ((apiCacheHits + apiCallCounter) % 10 === 0) {
        const hitRate = apiCacheHits / (apiCacheHits + apiCallCounter) * 100;
        console.log(`TTS Cache Stats - Total Requests: ${apiCacheHits + apiCallCounter}, Hit Rate: ${hitRate.toFixed(1)}%`);
      }
      
      return cachedAudio;
    }
    
    // Set up voice configuration
    const personality = options.personalityType || 'PROFESSIONAL';
    const gender = options.gender || 'MALE';
    
    // Select voice ID based on personality and gender
    const voiceId = options.customVoiceId || VOICE_IDS[gender][personality];
    
    // Get voice settings for this personality
    const settings = VOICE_SETTINGS[personality];
    
    console.log(`Generating speech with Google TTS API (voice: ${voiceId})...`);
    
    // Use dedicated Cloud TTS client for better reliability
    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: { 
        languageCode: 'en-US',
        name: voiceId
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: options.speed || settings.speed,
        pitch: options.pitch !== undefined ? options.pitch : settings.pitch,
        volumeGainDb: options.volumeGainDb !== undefined ? options.volumeGainDb : settings.volumeGainDb
      }
    });
    
    if (!response.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }
    
    // Convert audio content to base64
    const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString('base64');
    
    // Cache the audio in cloud storage
    const audioUrl = await cacheSpeech(cacheKey, `data:audio/mp3;base64,${audioBase64}`);
    
    if (!audioUrl) {
      // If caching failed, return the data URL directly
      console.warn('Cloud caching failed, returning data URL directly');
      return `data:audio/mp3;base64,${audioBase64}`;
    }
    
    // Increment API call counter
    apiCallCounter++;
    
    // Log generation time
    const endTime = Date.now();
    console.log(`TTS generation complete in ${endTime - startTime}ms`);
    
    return audioUrl;
  } catch (error) {
    console.error('Error generating speech with Google TTS:', error);
    console.error('Speech generation parameters:', {
      text: text ? text.substring(0, 20) + '...' : 'empty',
      personality: options.personalityType || 'PROFESSIONAL',
      gender: options.gender || 'MALE',
      executionTimeMs: Date.now() - startTime
    });
    
    // Fall back to Twilio's basic TTS
    return `<Response><Say>${text || 'Hello'}</Say></Response>`;
  }
}

/**
 * Helper function to stream audio to Twilio
 */
export function formatTwilioAudio(audioUrl: string): string {
  // If the audio URL is a TwiML response, return a sensible default URL
  if (audioUrl.startsWith('<Response>')) {
    return 'https://demo.twilio.com/docs/voice.xml';
  }
  
  // Otherwise just return the URL (could be Cloud Storage or data URL)
  return audioUrl;
}
