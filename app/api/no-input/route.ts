import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { generateSpeech, streamToTwilio } from '@/lib/google-advanced-tts';

const { VoiceResponse } = twilio.twiml;

export async function POST(request: Request) {
  console.log('=== START NO INPUT HANDLER ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    const twiml = new VoiceResponse();
    
    // Generate follow-up audio
    try {
      const followUpAudio = await generateSpeech('Hello? Anyone there? I can help you if you need assistance.', {
        personalityType: 'PROFESSIONAL',
        gender: 'MALE'
      });

      // Start gathering speech after follow-up
      const gather = twiml.gather({
        input: ['speech'],
        action: '/api/process-speech',
        method: 'POST',
        timeout: 15,  // Give more time on follow-up
        speechTimeout: 'auto',
        speechModel: 'phone_call',
        enhanced: true,
        profanityFilter: false,
        language: 'en-US'
      });
      
      gather.play(await streamToTwilio(followUpAudio));
      
      // If still no input after this, end the call
      twiml.say('I haven\'t heard anything. Please call back when you\'re ready to talk. Goodbye.');
      twiml.hangup();
      
    } catch (speechError) {
      console.error('Error generating follow-up speech:', speechError);
      // Fall back to basic TTS
      const gather = twiml.gather({
        input: ['speech'],
        action: '/api/process-speech',
        method: 'POST',
        timeout: 15,  // Give more time on follow-up
        speechTimeout: 'auto',
        speechModel: 'phone_call',
        enhanced: true,
        profanityFilter: false,
        language: 'en-US'
      });
      gather.say('Hello? Is anyone there? I can help you if you need assistance.');
      
      // If still no input, end call
      twiml.say('I haven\'t heard anything. Please call back when you\'re ready to talk. Goodbye.');
      twiml.hangup();
    }

    return new NextResponse(twiml.toString(), {
      headers: { 
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  } catch (error) {
    console.error('Error in no-input handler:', error);
    const twiml = new VoiceResponse();
    twiml.say('I apologize, but I encountered a technical issue. Please try your call again.');
    twiml.hangup();
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}
