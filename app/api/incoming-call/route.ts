import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import twilio from 'twilio';
import { personalityStore } from '@/lib/personality-store';
import { headers } from 'next/headers';
import { GoogleTTSVoice } from '@/types/voice-types';
import { getTwilioVoiceConfig, getVoiceConfigFromPersonality } from '@/lib/voice-processing';

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
    // Validate Twilio signature
    const twilioSignature = headers().get('x-twilio-signature');
    if (!twilioSignature) {
      console.error('Missing Twilio signature');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const callerNumber = formData.get('From') as string;
    const callSid = formData.get('CallSid') as string;

    if (!callerNumber || !callSid) {
      console.error('Missing required parameters:', { callerNumber, callSid });
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    if (!/^CA[a-f0-9]{32}$/.test(callSid)) {
      console.error('Invalid CallSid format:', callSid);
      return new NextResponse('Invalid CallSid format', { status: 400 });
    }
    
    console.log('Call from:', callerNumber, 'SID:', callSid);

    // Get current personality for metadata tracking
    const currentPersonality = personalityStore.getCurrentPersonality();

    // Get voice configuration for the current personality
    const voiceConfig = getTwilioVoiceConfig(getVoiceConfigFromPersonality(currentPersonality));
    
    // Create a personalized welcome message
    const welcomeMessage = getRandomGreeting();
    
    // Add the welcome message with the appropriate voice
    twiml.say(voiceConfig, welcomeMessage);
    
    // Set up gathering speech input from the caller
    const gather = twiml.gather({
      input: ['speech'],  // Twilio expects an array of input types
      action: `/api/process-speech?callSid=${callSid}&personalityId=${currentPersonality.name}`,
      speechTimeout: VOICE_PROCESSING_CONFIG.speechTimeout,
      language: 'en-US'
    });
    
    // If no input is detected, handle with no-input route
    // Use the redirect method from Twilio's VoiceResponse
    const redirectUrl = `/api/no-input?callSid=${callSid}&personalityId=${currentPersonality.name}`;
    twiml.say(voiceConfig, "I didn't hear anything. Let me know how I can help you.");
    gather.say(voiceConfig, "Please speak now.");

    // Initialize call in Pusher for dashboard tracking
    await pusherServer.trigger('calls', 'call-started', {
      callSid,
      callerNumber,
      timestamp,
      status: 'in-progress',
      personality: currentPersonality.name
    });
    
    // Set initial personality (for dashboard)
    await pusherServer.trigger(`call-${callSid}`, 'personality-changed', {
      timestamp,
      personality: currentPersonality
    });

    // Set initial call status
    await pusherServer.trigger(`call-${callSid}`, 'call-updated', {
      timestamp,
      status: 'in-progress',
      callerNumber,
      activePersonality: currentPersonality.name
    });

    // Return TwiML response with forwarding instructions
    return createTwiMLResponse(twiml.toString());

  } catch (error) {
    console.error('Error in incoming call handler:', error);
    return createErrorResponse();
  } finally {
    console.log('=== END INCOMING CALL HANDLER ===');
  }
}
