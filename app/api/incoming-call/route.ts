import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { pusherServer } from '@/lib/pusher';

const { VoiceResponse } = twilio.twiml;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const callerNumber = formData.get('From') as string;
    const callSid = formData.get('CallSid') as string;

    console.log('Incoming call from:', callerNumber);
    console.log('Call SID:', callSid);

    // Notify dashboard of new call
    await pusherServer.trigger('calls', 'new-call', {
      callSid,
      callerNumber,
      transcript: [],
    });

    const twiml = new VoiceResponse();

    // Add a pause to ensure the call connects properly
    twiml.pause({ length: 1 });
    
    twiml.say({ voice: 'Polly.Amy' }, 'Hello! I am an AI assistant. How may I help you today?');
    
    twiml.gather({
      input: ['speech'],
      action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/process-speech`,
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US',
    });

    const response = twiml.toString();
    console.log('TwiML Response:', response);

    return new NextResponse(response, {
      headers: { 'Content-Type': 'text/xml' },
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
