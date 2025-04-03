import { NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID
});

export async function POST(request: Request) {
  const { callSid } = await request.json();

  try {
    // End the call gracefully
    await client.calls(callSid)
      .update({
        twiml: new twilio.twiml.VoiceResponse()
          .say('Thank you for calling. Goodbye.')
          .hangup()
          .toString()
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
