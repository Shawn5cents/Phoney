import { NextResponse } from 'next/server';
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error('Missing Twilio credentials');
}

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const { callSid } = await request.json();

  try {
    // Redirect the call to the browser
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
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
