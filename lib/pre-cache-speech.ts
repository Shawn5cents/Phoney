import { COMMON_PHRASES } from './speech-cache';
import { generateSpeech } from './google-advanced-tts';
import { personalities } from './ai-personalities';

/**
 * Pre-caches common phrases to improve reliability and reduce API costs
 * Call this at app startup or during build/deploy
 */
export async function preCacheCommonPhrases(): Promise<void> {
  console.log('Starting speech pre-caching process...');
  
  // Get list of personalities
  const personalityTypes = Object.keys(personalities);
  
  // Counter for tracking progress
  let completed = 0;
  let total = COMMON_PHRASES.length * 2 * personalityTypes.length; // phrases * genders * personalities
  
  try {
    // Pre-cache each phrase with different voice configurations
    for (const phrase of COMMON_PHRASES) {
      for (const personalityId of personalityTypes) {
        // Skip pre-caching for some personality types to reduce initial load
        if (personalityId !== 'professional' && personalityId !== 'friendly') continue;
        
        // Convert personality ID to the format expected by TTS
        const personalityType = personalityId.toUpperCase() as 'PROFESSIONAL' | 'FRIENDLY' | 'WITTY' | 'ZEN';
        
        // Cache male voice version
        try {
          await generateSpeech(phrase, {
            personalityType,
            gender: 'MALE'
          });
          completed++;
          console.log(`Pre-cached [${completed}/${total}]: "${phrase}" (${personalityType}, MALE)`);
        } catch (error) {
          console.error(`Failed to pre-cache: "${phrase}" (${personalityType}, MALE)`, error);
        }
        
        // Cache female voice version
        try {
          await generateSpeech(phrase, {
            personalityType,
            gender: 'FEMALE'
          });
          completed++;
          console.log(`Pre-cached [${completed}/${total}]: "${phrase}" (${personalityType}, FEMALE)`);
        } catch (error) {
          console.error(`Failed to pre-cache: "${phrase}" (${personalityType}, FEMALE)`, error);
        }
      }
    }
    
    console.log(`Speech pre-caching completed: ${completed}/${total} phrases cached successfully`);
  } catch (error) {
    console.error('Error during speech pre-caching:', error);
  }
}

// Export a function to run pre-caching in the background to avoid blocking the app
export function startBackgroundPreCaching(): void {
  setTimeout(() => {
    preCacheCommonPhrases().catch(err => {
      console.error('Background pre-caching failed:', err);
    });
  }, 5000); // Start after 5 seconds to allow app to initialize
}
