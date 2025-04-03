import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { pusherServer } from '@/lib/pusher';

const { VoiceResponse } = twilio.twiml;

export async function POST(request: Request) {
  const formData = await request.formData();
  const callerNumber = formData.get('From') as string;
  const callSid = formData.get('CallSid') as string;

  // Notify dashboard of new call
  await pusherServer.trigger('calls', 'new-call', {
    callSid,
    callerNumber,
    transcript: [],
  });

  const twiml = new VoiceResponse();
  twiml.say({ voice: 'Polly.Amy' }, 'Hello! I am an AI assistant. How may I help you today?');
  
  twiml.gather({
    input: ['speech'],
    action: '/api/process-speech',
    method: 'POST',
    speechTimeout: 'auto',
    language: 'en-US',
  });

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
