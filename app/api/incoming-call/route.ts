import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import twilio from 'twilio';

const { VoiceResponse } = twilio.twiml;

// Last updated: 2025-04-03 14:27
export async function POST(request: Request) {
  try {
    console.log('Incoming call received - VERBOSE LOGGING ENABLED');
    
    const formData = await request.formData();
    console.log('Form data received:', Object.fromEntries(formData.entries()));
    const callerNumber = formData.get('From') as string;
    const callSid = formData.get('CallSid') as string;

    console.log('Call from:', callerNumber, 'SID:', callSid);

    // Notify dashboard of new call
    try {
      await pusherServer.trigger(`call-${callSid}`, 'call.started', {
        callId: callSid,
        caller: callerNumber,
        status: 'active',
        timestamp: new Date().toISOString()
      });
      console.log('Dashboard notified of new call');
    } catch (pusherError) {
      console.error('Failed to notify dashboard:', pusherError);
      // Continue with the call even if dashboard notification fails
    }
    
    console.log('Creating TwiML response...');
    const twiml = new VoiceResponse();
    
    // Simple debug response
    console.log('Adding debug message...');
    twiml.say({ voice: 'Polly.Amy', language: 'en-US' }, 'This is a test call. If you hear this message, the call handling is working correctly.');
    
    // Just pause for 5 seconds to ensure the call stays connected
    console.log('Adding pause...');
    twiml.pause({ length: 5 });
    
    // Say goodbye
    console.log('Adding goodbye message...');
    twiml.say({ voice: 'Polly.Amy', language: 'en-US' }, 'Goodbye!');

    const response = twiml.toString();
    console.log('TwiML Response generated:', response);

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
