import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { mkdir } from 'fs/promises';

// Define the cache directory
const CACHE_DIR = path.join(process.cwd(), '.cache', 'speech');

// Ensure cache directory exists
const ensureCacheDir = async () => {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    return true;
  } catch (error) {
    console.error('Failed to create cache directory:', error);
    return false;
  }
};

// Generate a hash key from the speech options
export function generateCacheKey(text: string, options: any): string {
  // Create a stable JSON representation of options, ensuring keys are sorted
  const stableOptions = JSON.stringify(options, Object.keys(options).sort());
  const input = `${text}:${stableOptions}`;
  return crypto.createHash('md5').update(input).digest('hex');
}

// Check if a cached item exists
export async function getCachedSpeech(cacheKey: string): Promise<string | null> {
  try {
    await ensureCacheDir();
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.txt`);
    
    if (fs.existsSync(cachePath)) {
      // Check if the file was created within the last 7 days
      const stats = fs.statSync(cachePath);
      const fileAge = Date.now() - stats.mtimeMs;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      
      if (fileAge < maxAge) {
        console.log(`Cache hit for speech: ${cacheKey}`);
        return fs.readFileSync(cachePath, 'utf8');
      } else {
        console.log(`Cache expired for speech: ${cacheKey}`);
        // Delete expired cache
        fs.unlinkSync(cachePath);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading from speech cache:', error);
    return null;
  }
}

// Save speech audio to cache
export async function cacheSpeech(cacheKey: string, audioData: string): Promise<boolean> {
  try {
    await ensureCacheDir();
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.txt`);
    fs.writeFileSync(cachePath, audioData);
    console.log(`Cached speech: ${cacheKey}`);
    return true;
  } catch (error) {
    console.error('Error writing to speech cache:', error);
    return false;
  }
}

// Initialize cache and clean up old entries
export async function initSpeechCache(): Promise<void> {
  try {
    await ensureCacheDir();
    
    // Clean up cache entries older than 7 days
    const files = fs.readdirSync(CACHE_DIR);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;
      
      if (fileAge > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Removed expired cache: ${file}`);
      }
    }
    
    console.log(`Speech cache initialized with ${files.length} entries`);
  } catch (error) {
    console.error('Failed to initialize speech cache:', error);
  }
}

// Common phrases we can pre-cache
export const COMMON_PHRASES = [
  'Hello?',
  'Hello? Anyone there?',
  'I apologize, but I encountered an error. Please try again.',
  'Thank you for your call. How can I help you today?',
  'I didn\'t catch that. Could you please repeat?',
  'Please hold while I transfer your call.',
  'Is there anything else I can help you with?'
];
