import { NextResponse } from 'next/server';

// Simple JWT creation function
function createJWT(payload: any, secret: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = require('crypto')
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const { identity } = await request.json();

    // Create token payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      jti: `${process.env.TWILIO_ACCOUNT_SID}-${now}`,
      grants: {
        identity,
        voice: {
          incoming: {
            allow: true
          },
          outgoing: {
            application_sid: process.env.TWILIO_APP_SID
          }
        }
      },
      iss: process.env.TWILIO_API_KEY_SID,
      sub: process.env.TWILIO_ACCOUNT_SID,
      exp: now + 3600, // Token expires in 1 hour
      nbf: now
    };

    // Generate token
    const token = createJWT(payload, process.env.TWILIO_API_KEY_SECRET!);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

// Add type safety for environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TWILIO_ACCOUNT_SID: string;
      TWILIO_API_KEY_SID: string;
      TWILIO_API_KEY_SECRET: string;
      TWILIO_APP_SID?: string;
    }
  }
}
