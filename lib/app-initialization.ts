import { initSpeechCache } from './speech-cache';
import { startBackgroundPreCaching } from './pre-cache-speech';

/**
 * Initialize app services and optimizations
 * Call this during application startup
 */
export async function initializeAppServices(): Promise<void> {
  console.log('Initializing app services...');
  
  try {
    // Initialize the speech cache
    await initSpeechCache();
    
    // Start pre-caching in the background
    // This will pre-generate common phrases to avoid API calls during actual calls
    startBackgroundPreCaching();
    
    console.log('App services initialized successfully');
  } catch (error) {
    console.error('Error initializing app services:', error);
  }
}
