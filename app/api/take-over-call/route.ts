import { NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(request: Request) {
  const { callSid } = await request.json();

  try {
    // Redirect the call to the browser
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: 'man', language: 'en-US' }, 'Transferring you to a human operator.');
    twiml.redirect('/api/browser-call');

    await client.calls(callSid)
      .update({
        twiml: twiml.toString()
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
