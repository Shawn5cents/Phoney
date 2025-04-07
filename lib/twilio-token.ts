const AccessToken = require('twilio/lib/jwt/AccessToken');
const VoiceGrant = require('twilio/lib/jwt/AccessToken/VoiceGrant');

export interface TokenOptions {
  identity: string;
}

export async function generateToken(options: TokenOptions): Promise<string> {
  const { identity } = options;

  // Create an access token
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY_SID!,
    process.env.TWILIO_API_KEY_SECRET!,
    { identity }
  );

  // Create a Voice grant
  const voiceGrant = new VoiceGrant({
    incomingAllow: true,
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID
  });

  // Add the grant to the token
  token.addGrant(voiceGrant);

  // Serialize the token
  return token.toJwt();
}