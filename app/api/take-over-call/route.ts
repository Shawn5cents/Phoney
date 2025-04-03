import { NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID
});

export async function POST(request: Request) {
  const { callSid, phoneNumber } = await request.json();

  try {
    // Update call to redirect to user's phone
    await client.calls(callSid)
      .update({
        twiml: new twilio.twiml.VoiceResponse()
          .say('Transferring to a human operator...')
          .dial(phoneNumber)
          .toString()
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error taking over call:', error);
    return NextResponse.json(
      { error: 'Failed to take over call' },
      { status: 500 }
    );
  }
}
