import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { pusherServer } from '@/lib/pusher';

const { VoiceResponse } = twilio.twiml;

export async function POST(request: Request) {
  try {
    console.log('Incoming call received');
    
    const formData = await request.formData();
    console.log('Form data:', Object.fromEntries(formData.entries()));
    
    const callerNumber = formData.get('From') as string;
    const callSid = formData.get('CallSid') as string;

    console.log('Incoming call from:', callerNumber);
    console.log('Call SID:', callSid);

    // Create basic TwiML first
    const twiml = new VoiceResponse();
    
    // Add a longer pause at the start
    twiml.pause({ length: 2 });
    
    // Simple greeting without Pusher for now
    twiml.say({ voice: 'Polly.Amy', language: 'en-US' }, 'Hello! I am an AI assistant. How may I help you today?');
    
    // Add another pause
    twiml.pause({ length: 1 });
    
    // Set up speech recognition
    twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US',
      timeout: 5,
    });

    const response = twiml.toString();
    console.log('TwiML Response:', response);

    // Try to notify dashboard after TwiML is ready
    try {
      await pusherServer.trigger('calls', 'new-call', {
        callSid,
        callerNumber,
        transcript: [],
      });
    } catch (pusherError) {
      console.error('Pusher notification failed:', pusherError);
      // Continue anyway as this is not critical
    }

    return new NextResponse(response, {
      headers: { 
        'Content-Type': 'text/xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error handling incoming call:', error);
    const twiml = new VoiceResponse();
    twiml.say('I apologize, but I encountered an error. Please try again.');
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
