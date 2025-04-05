import crypto from 'crypto';

// Use in-memory cache for compatibility with serverless environments like Vercel
// This is more reliable than filesystem caching for serverless deployments
const memoryCache: Map<string, { data: string, timestamp: number }> = new Map();

// Check if running in production (Vercel) or development
const isProduction = process.env.NODE_ENV === 'production';
const MAX_CACHE_SIZE = 100; // Maximum number of items to keep in memory
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Function to manage cache size
const pruneCache = () => {
  if (memoryCache.size <= MAX_CACHE_SIZE) return;
  
  // Find the oldest entries to remove
  const entries = Array.from(memoryCache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  // Remove oldest entries until we're under the limit
  const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
  for (const [key] of toRemove) {
    memoryCache.delete(key);
    console.log(`Pruned cache entry: ${key}`);
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
    // Check memory cache
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      // Check if the cache is still valid
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_TTL) {
        console.log(`Cache hit for speech: ${cacheKey}`);
        return cached.data;
      } else {
        console.log(`Cache expired for speech: ${cacheKey}`);
        memoryCache.delete(cacheKey);
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
    // Add to memory cache
    memoryCache.set(cacheKey, {
      data: audioData,
      timestamp: Date.now()
    });
    
    // Prune cache if it gets too large
    pruneCache();
    
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
    // Clear out any stale entries in the memory cache
    const now = Date.now();
    let expiredCount = 0;
    
    // Use Array.from to avoid TypeScript iterator compatibility issues
    Array.from(memoryCache.entries()).forEach(([key, value]) => {
      if (now - value.timestamp > CACHE_TTL) {
        memoryCache.delete(key);
        expiredCount++;
      }
    })
    
    console.log(`Speech cache initialized. Cleared ${expiredCount} expired entries. Current cache size: ${memoryCache.size}`);
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
