import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Cache directory - Railway provides persistent storage
const CACHE_DIR = path.join(process.cwd(), 'tts-cache');
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Initialize the cache directory
 */
export async function initCacheSystem(): Promise<void> {
  try {
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.log('Created TTS cache directory:', CACHE_DIR);
    }
    
    // Clean up expired files in the background
    setTimeout(() => cleanExpiredCache(), 5000);
    
    console.log('Filesystem cache initialized at', CACHE_DIR);
  } catch (error) {
    console.error('Failed to initialize cache directory:', error);
  }
}

/**
 * Generate a cache key from text and options
 */
export function generateCacheKey(text: string, options: any): string {
  // Create a stable JSON representation of options, ensuring keys are sorted
  const stableOptions = JSON.stringify(options, Object.keys(options).sort());
  const input = `${text}:${stableOptions}`;
  return crypto.createHash('md5').update(input).digest('hex');
}

/**
 * Check if a cached item exists and is valid
 */
export async function getCachedSpeech(cacheKey: string): Promise<string | null> {
  try {
    const cacheFilePath = path.join(CACHE_DIR, `${cacheKey}.mp3`);
    const metaFilePath = path.join(CACHE_DIR, `${cacheKey}.meta`);
    
    // Check if cache file exists
    if (!fs.existsSync(cacheFilePath) || !fs.existsSync(metaFilePath)) {
      return null;
    }
    
    // Read metadata to check timestamp
    const metadata = JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
    const age = Date.now() - metadata.timestamp;
    
    // Return null if cache has expired
    if (age > CACHE_TTL) {
      // Remove expired files (non-blocking)
      setTimeout(() => {
        try {
          fs.unlinkSync(cacheFilePath);
          fs.unlinkSync(metaFilePath);
        } catch (err) {
          console.error('Error removing expired cache files:', err);
        }
      }, 100);
      return null;
    }
    
    // Read the audio data
    const audioData = fs.readFileSync(cacheFilePath, 'base64');
    console.log(`Cache hit for speech: ${cacheKey}`);
    
    return audioData;
  } catch (error) {
    console.error('Error reading from speech cache:', error);
    return null;
  }
}

/**
 * Save audio data to filesystem cache
 */
export async function cacheSpeech(cacheKey: string, audioData: string): Promise<string | null> {
  try {
    const cacheFilePath = path.join(CACHE_DIR, `${cacheKey}.mp3`);
    const metaFilePath = path.join(CACHE_DIR, `${cacheKey}.meta`);
    
    // Write the audio data to a file
    const buffer = Buffer.from(audioData, 'base64');
    fs.writeFileSync(cacheFilePath, buffer);
    
    // Write metadata
    const metadata = {
      timestamp: Date.now(),
      size: buffer.length
    };
    fs.writeFileSync(metaFilePath, JSON.stringify(metadata));
    
    console.log(`Cached speech: ${cacheKey} (${buffer.length} bytes)`);
    return audioData;
  } catch (error) {
    console.error('Error writing to speech cache:', error);
    return null;
  }
}

/**
 * Clean expired cache files
 */
async function cleanExpiredCache(): Promise<void> {
  try {
    if (!fs.existsSync(CACHE_DIR)) return;
    
    const now = Date.now();
    const files = fs.readdirSync(CACHE_DIR);
    let cleanedCount = 0;
    
    // Find all .meta files
    const metaFiles = files.filter(file => file.endsWith('.meta'));
    
    for (const metaFile of metaFiles) {
      const metaFilePath = path.join(CACHE_DIR, metaFile);
      try {
        // Read metadata to check timestamp
        const metadata = JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
        const age = now - metadata.timestamp;
        
        // Remove if expired
        if (age > CACHE_TTL) {
          const cacheKey = metaFile.substring(0, metaFile.length - 5); // Remove .meta
          const cacheFilePath = path.join(CACHE_DIR, `${cacheKey}.mp3`);
          
          // Remove both files
          if (fs.existsSync(cacheFilePath)) fs.unlinkSync(cacheFilePath);
          fs.unlinkSync(metaFilePath);
          cleanedCount++;
        }
      } catch (err) {
        console.error(`Error processing cache file ${metaFile}:`, err);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned ${cleanedCount} expired cache files`);
    }
  } catch (error) {
    console.error('Error cleaning expired cache:', error);
  }
}
