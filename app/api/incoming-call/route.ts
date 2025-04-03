import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { pusherServer } from '@/lib/pusher';

const { VoiceResponse } = twilio.twiml;

export async function POST(request: Request) {
  try {
    console.log('Incoming call received');
    
    const twiml = new VoiceResponse();
    twiml.say({ voice: 'alice' }, 'Hello, this is a test.');

    const response = twiml.toString();
    console.log('TwiML Response:', response);

    return new NextResponse(response, {
      headers: { 'Content-Type': 'application/xml' },
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
