import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import twilio from 'twilio';
import { personalityStore } from '@/lib/personality-store';
import { headers } from 'next/headers';
import { GoogleTTSVoice } from '@/types/voice-types';

const { VoiceResponse } = twilio.twiml;

// Amazon Connect configuration
const AMAZON_CONNECT_CONFIG = {
  // Replace with your actual Amazon Connect instance details
  instanceId: process.env.AMAZON_CONNECT_INSTANCE_ID || 'your-instance-id',
  contactFlowId: process.env.AMAZON_CONNECT_FLOW_ID || 'your-contact-flow-id',
  // This should be the phone number or SIP endpoint for your Amazon Connect instance
  connectEndpoint: process.env.AMAZON_CONNECT_ENDPOINT || '+15551234567'
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

    // Create a welcome message before forwarding
    twiml.say(
      { voice: 'Polly.Matthew' },
      'Welcome to Phoney. Please hold while we connect you to our advanced voice system.'
    );
    
    // Forward the call to Amazon Connect using SIP or regular phone number
    // Option A: SIP Trunking (uncomment if using SIP)
    // const sip = twiml.dial().sip(`sip:${AMAZON_CONNECT_CONFIG.instanceId}@your-sip-domain.com`);
    // sip.parameter({ name: 'callerId', value: callerNumber });
    // sip.parameter({ name: 'personalityId', value: currentPersonality.name });
    
    // Option B: Simple Call Forwarding (using regular phone number)
    const dial = twiml.dial({
      callerId: callerNumber, // Pass the original caller ID
      // You can add additional parameters as needed
      // answerOnBridge: true // Uncomment to maintain call quality during transfer
    });
    dial.number(AMAZON_CONNECT_CONFIG.connectEndpoint);

    // Initialize call in Pusher for dashboard tracking
    await pusherServer.trigger('calls', 'call-started', {
      callSid,
      callerNumber,
      timestamp,
      status: 'forwarded-to-connect',
      forwardedTo: AMAZON_CONNECT_CONFIG.connectEndpoint
    });
    
    // Set initial personality (for dashboard)
    await pusherServer.trigger(`call-${callSid}`, 'personality-changed', {
      timestamp,
      personality: currentPersonality
    });

    // Set initial call status
    await pusherServer.trigger(`call-${callSid}`, 'call-updated', {
      timestamp,
      status: 'forwarded',
      callerNumber,
      forwardedTo: 'Amazon Connect'
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
