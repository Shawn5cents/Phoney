import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { generateSpeech, getVoiceOptions } from '@/lib/google-advanced-tts';

const { VoiceResponse } = twilio.twiml;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid');
    
    if (!callSid) {
      return new NextResponse('Missing CallSid', { status: 400 });
    }

    const twiml = new VoiceResponse();

    try {
      // Generate a follow-up prompt using TTS
      const followUpText = "I didn't hear you. Could you please speak again?";
      const voiceOptions = getVoiceOptions('professional');
      const followUpAudio = await generateSpeech(followUpText, voiceOptions);

      // Start gathering speech after follow-up
      const gather = twiml.gather({
        input: ['speech'],
        action: '/api/process-speech',
        method: 'POST',
        timeout: 5,
        speechTimeout: 'auto'
      });

      // Add the audio prompt using say with proper voice settings
      gather.say({
        language: voiceOptions.languageCode,
        voice: voiceOptions.name
      }, followUpText);

      // If still no input after this, end the call
      twiml.say({
        language: voiceOptions.languageCode,
        voice: voiceOptions.name
      }, "I haven't heard anything. Please call back when you're ready to talk. Goodbye.");

      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      });
    } catch (audioError) {
      console.error('Error generating audio:', audioError);
      
      // Fall back to basic TTS
      const gather = twiml.gather({
        input: ['speech'],
        action: '/api/process-speech',
        method: 'POST',
        timeout: 5,
        speechTimeout: 'auto'
      });

      // Use basic voice settings for fallback
      gather.say({
        language: 'en-US',
        voice: 'en-US-Neural2-D'
      }, 'Hello? Is anyone there? I can help you if you need assistance.');

      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      });
    }
  } catch (error) {
    console.error('Error in no-input handler:', error);
    const twiml = new VoiceResponse();
    twiml.say({
      language: 'en-US',
      voice: 'en-US-Neural2-D'
    }, 'Sorry, something went wrong. Please try again.');
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}
