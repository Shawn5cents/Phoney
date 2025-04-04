import { NextResponse } from 'next/server';
import twilio from 'twilio';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export async function POST(request: Request) {
  try {
    const { callId } = await request.json();

    // Create an access token
    const accessToken = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_ACCOUNT_SID!,  // Using account SID as API key SID
      process.env.TWILIO_AUTH_TOKEN!,   // Using auth token as API key secret
      { identity: 'human-operator' }
    );

    // Create a Voice grant and add it to the token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_APP_SID,
      incomingAllow: true,
    });

    accessToken.addGrant(voiceGrant);

    // Generate the token
    const token = accessToken.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
