import { NextResponse } from 'next/server';
import * as Twilio from 'twilio';
import { pusherServer } from '@/lib/pusher';

// Initialize the Twilio client using the class constructor
const client = new (Twilio as any)(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_API_KEY_SECRET!
);
const { VoiceResponse } = Twilio.twiml;

export async function POST(request: Request) {
  const { callSid } = await request.json();

  try {
    // End the call using Twilio's API
    const voiceResponse = new VoiceResponse();
    voiceResponse.say({
      voice: 'woman', // Use a standard Twilio voice that's compatible with TypeScript definitions
      language: 'en-US'
    }, 'Thank you for calling. Goodbye.');

    await client.calls(callSid)
      .update({
        twiml: voiceResponse.toString()
      });

    // Notify dashboard of call end
    await pusherServer.trigger(`call-${callSid}`, 'call.ended', {
      callSid,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending call:', error);
    return NextResponse.json(
      { error: 'Failed to end call' },
      { status: 500 }
    );
  }
}
