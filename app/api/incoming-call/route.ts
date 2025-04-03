import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { pusherServer } from '@/lib/pusher';

const { VoiceResponse } = twilio.twiml;

// Last updated: 2025-04-03 14:27
export async function POST(request: Request) {
  try {
    console.log('Incoming call received');
    
    const formData = await request.formData();
    const callerNumber = formData.get('From') as string;
    const callSid = formData.get('CallSid') as string;

    console.log('Call from:', callerNumber, 'SID:', callSid);

    // Notify dashboard of new call
    try {
      await pusherServer.trigger('calls', 'new-call', {
        callSid,
        callerNumber,
        transcript: [],
      });
      console.log('Dashboard notified of new call');
    } catch (pusherError) {
      console.error('Failed to notify dashboard:', pusherError);
      // Continue with the call even if dashboard notification fails
    }
    
    const twiml = new VoiceResponse();
    
    // Greet the caller
    twiml.say({ voice: 'Polly.Amy', language: 'en-US' }, 'Hello! I am an AI assistant. How may I help you today?');
    
    // Listen for speech
    twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US',
    });

    const response = twiml.toString();
    console.log('TwiML Response:', response);

    return new NextResponse(response, {
      headers: { 
        'Content-Type': 'application/xml',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  } catch (error) {
    console.error('Error handling incoming call:', error);
    const twiml = new VoiceResponse();
    twiml.say('I apologize, but I encountered an error. Please try again.');
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
