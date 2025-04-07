// Voice processing configuration constants
export const voiceProcessingConfig = {
  // Default voice settings if not specified
  defaultVoice: {
    languageCode: 'en-US',
    name: 'nova',
    ssmlGender: 'FEMALE' as const
  },
  
  // Speech recognition settings
  speechRecognition: {
    model: 'gpt-4o-transcribe',
    language: 'en',
    responseFormat: 'text'
  },

  // Audio output settings
  audioOutput: {
    model: 'gpt-4o-mini-tts',
    format: 'mp3'
  }
};

// Map of OpenAI voices to Twilio voice names
export const VOICE_MAPPING: Record<string, string> = {
  // OpenAI voices
  'alloy': 'woman',    // Neutral voice
  'echo': 'man',       // Deep male voice
  'fable': 'woman',    // Expressive female voice
  'onyx': 'man',       // Deep male voice
  'nova': 'woman',     // Clear female voice
  'shimmer': 'woman'   // Warm female voice
};
