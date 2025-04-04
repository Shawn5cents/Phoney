import { NextResponse } from 'next/server';
import twilio from 'twilio';

const { VoiceResponse } = twilio.twiml;

// Last updated: 2025-04-03 14:27
export async function POST(request: Request) {
  console.log('=== START INCOMING CALL HANDLER ===');
  
  try {
    console.log('Creating basic TwiML response...');
    const twiml = new VoiceResponse();
    
    // Super simple response
    twiml.say('Hello, this is a test.');
    
    const response = twiml.toString();
    console.log('Generated TwiML:', response);

    return new NextResponse(response, {
      headers: { 
        'Content-Type': 'text/xml; charset=utf-8'
      },
    });
  } catch (error) {
    console.error('=== ERROR IN INCOMING CALL HANDLER ===');
    console.error('Error details:', error);
    
    try {
      const twiml = new VoiceResponse();
      twiml.say('Test error response');
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      });
    } catch (twimlError) {
      console.error('Failed to generate error TwiML:', twimlError);
      return new NextResponse('<Response><Say>Error</Say></Response>', {
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      });
    }
  }
  finally {
    console.log('=== END INCOMING CALL HANDLER ===');
  }
}
