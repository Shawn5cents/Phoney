import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import twilio from 'twilio';
import { personalityStore } from '@/lib/personality-store';
import { headers } from 'next/headers';
import { generateSpeech } from '@/lib/google-advanced-tts';
import { GoogleTTSVoice } from '@/types/voice-types';

const { VoiceResponse } = twilio.twiml;

// Configure high-quality voices for different personalities using most natural-sounding Studio voices
const VOICE_CONFIG: Record<string, GoogleTTSVoice> = {
  professional: { languageCode: 'en-US', name: 'en-US-Studio-O', ssmlGender: 'FEMALE' }, // Warm, confident female voice
  friendly: { languageCode: 'en-US', name: 'en-US-Studio-M', ssmlGender: 'MALE' },   // Natural, casual male voice
  witty: { languageCode: 'en-US', name: 'en-US-Studio-D', ssmlGender: 'MALE' },      // Energetic male voice
  zen: { languageCode: 'en-US', name: 'en-US-Studio-F', ssmlGender: 'FEMALE' }        // Calm, soothing female voice
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

    // Get current personality and voice configuration
    const currentPersonality = personalityStore.getCurrentPersonality();
    const voiceConfig = VOICE_CONFIG[currentPersonality.name.toLowerCase()];

    // Generate a natural-sounding welcome message
    const welcomeMessage = getRandomGreeting();
    
    // Create SSML for more natural speech with slight pauses and intonation
    const ssml = `<speak>
      <prosody rate="95%" pitch="+0.5st">${welcomeMessage}</prosody>
    </speak>`;
    
    // Generate audio content with enhanced natural speech
    const audioContent = await generateSpeech(ssml, voiceConfig);
    const audioUrl = `data:audio/mp3;base64,${audioContent.toString('base64')}`;
    
    // Set up continuous conversation
    const gather = twiml.gather({
      input: ['speech'],
      action: '/api/conversation',
      method: 'POST',
      speechTimeout: 'auto',
      enhanced: true
    });
    
    // Play the generated audio using TwiML
    gather.say({}, welcomeMessage);

    // Initialize call in Pusher
    await pusherServer.trigger('calls', 'call-started', {
      callSid,
      callerNumber,
      timestamp,
      status: 'active'
    });
    // Set initial personality
    await pusherServer.trigger(`call-${callSid}`, 'personality-changed', {
      timestamp,
      personality: currentPersonality
    });

    // Set initial call status
    await pusherServer.trigger(`call-${callSid}`, 'call-updated', {
      timestamp,
      status: 'active',
      callerNumber
    });

    // Return TwiML response
    return createTwiMLResponse(twiml.toString());

  } catch (error) {
    console.error('Error in incoming call handler:', error);
    return createErrorResponse();
  } finally {
    console.log('=== END INCOMING CALL HANDLER ===');
  }
}
