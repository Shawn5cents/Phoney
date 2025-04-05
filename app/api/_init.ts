// Server-side initialization for API routes
import { initializeAppServices } from '@/lib/app-initialization';

// Initialize services when this module is imported
console.log('Initializing API services...');

// Start initialization process
let initializationPromise: Promise<void> | null = null;

export function ensureInitialized(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initializeAppServices();
  }
  return initializationPromise;
}

// Start initialization immediately
ensureInitialized().catch(err => {
  console.error('Failed to initialize API services:', err);
});
