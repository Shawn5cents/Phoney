import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { SayAttributes } from 'twilio/lib/twiml/VoiceResponse';
import { personalityStore } from '@/lib/personality-store';
import { getTwilioVoiceConfig, getVoiceConfigFromPersonality } from '@/lib/voice-processing';
import { validateAndExtractCallData } from '@/lib/twilio-validation';
import { CallEventManager } from '@/lib/call-events';

const { VoiceResponse } = twilio.twiml;

// Advanced voice processing configuration
const VOICE_PROCESSING_CONFIG = {
  // Speech timeout in seconds
  speechTimeout: 'auto',
  // Maximum recording length in seconds
  maxRecordingLength: 60,
  // Default language code
  defaultLanguage: 'en-US'
};

// Natural greeting variations
const GREETING_VARIATIONS = [
  "Hi there! Thanks for calling.",
  "Hello! How can I help you today?",
  "Thanks for calling! What can I do for you?"
];

// Helper function to get a random greeting
const getRandomGreeting = () => {
  const index = Math.floor(Math.random() * GREETING_VARIATIONS.length);
  return GREETING_VARIATIONS[index];
};

// Helper function to create TwiML response
const createTwiMLResponse = (xml: string, status: number = 200) => {
  return new NextResponse(xml, {
    status,
    headers: { 'Content-Type': 'text/xml' }
  });
};

// Helper function to create error response
const createErrorResponse = (message?: string) => {
  const twiml = new VoiceResponse();
  twiml.say({ voice: 'alice' }, message || 'I apologize, but I encountered an error. Please try calling again.');
  return createTwiMLResponse(twiml.toString(), 500);
};

export async function POST(request: Request) {
  console.log('=== START INCOMING CALL HANDLER ===');
  const timestamp = new Date().toISOString();
  const twiml = new VoiceResponse();
  
  try {
    // Validate and extract call data
    const callData = await validateAndExtractCallData(request);
    if (!callData) {
      console.error('Invalid request data');
      return new NextResponse('Invalid request', { status: 400 });
    }

    const { callerNumber, callSid } = callData;
    
    console.log('Call from:', callerNumber, 'SID:', callSid);

    // Get current personality for metadata tracking
    const currentPersonality = personalityStore.getCurrentPersonality();

    // Get voice configuration for the current personality
    const voiceConfig = getTwilioVoiceConfig(getVoiceConfigFromPersonality(currentPersonality));
    
    // Create a personalized welcome message
    const welcomeMessage = getRandomGreeting();
    
    // Add the welcome message with the appropriate voice
    // Convert to SayAttributes for TypeScript compatibility
    const sayAttrs: SayAttributes = {
      voice: voiceConfig.voice as any, // Cast to any to avoid TypeScript error
      language: voiceConfig.language
    };
    
    // Apply voice configuration
    twiml.say(sayAttrs, welcomeMessage);
    
    // Set up gathering speech input from the caller
    const gather = twiml.gather({
      input: ['speech'],  // Twilio expects an array of input types
      action: `/api/process-speech?callSid=${callSid}&personalityId=${currentPersonality.name}`,
      speechTimeout: VOICE_PROCESSING_CONFIG.speechTimeout,
      language: 'en-US'
    });
    
    // If no input is detected, handle with no-input route
    const redirectUrl = `/api/no-input?callSid=${callSid}&personalityId=${currentPersonality.name}`;
    twiml.say(sayAttrs, "I didn't hear anything. Let me know how I can help you.");
    gather.say(sayAttrs, "Please speak now.");

    // Initialize call events
    await CallEventManager.initializeCall(
      { callSid, callerNumber, timestamp, personality: currentPersonality.name },
      currentPersonality
    );

    // Return TwiML response with forwarding instructions
    return createTwiMLResponse(twiml.toString());

  } catch (error) {
    console.error('Error in incoming call handler:', error);
    return createErrorResponse();
  } finally {
    console.log('=== END INCOMING CALL HANDLER ===');
  }
}
