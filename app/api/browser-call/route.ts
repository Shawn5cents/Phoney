import { NextResponse } from 'next/server';
import twilio from 'twilio';

const twiml = new twilio.twiml.VoiceResponse();

// Configure the call for browser-based interaction
twiml.connect()
  .stream({
    url: `wss://${process.env.VERCEL_URL}/api/media-stream`,
  });

export async function POST(request: Request) {
  return NextResponse.json(
    { twiml: twiml.toString() },
    { headers: { 'Content-Type': 'application/xml' } }
  );
}
