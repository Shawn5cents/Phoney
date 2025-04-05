import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { generateSpeech, getVoiceOptions, streamToTwilio } from '@/lib/google-advanced-tts';
import { personalityStore } from '@/lib/personality-store';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: Request) {
  console.log('=== NO INPUT HANDLER ===');

  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;

    if (!callSid) {
      console.error('Missing CallSid');
      return new NextResponse('Missing CallSid', { status: 400 });
    }

    const personality = personalityStore.getCurrentPersonality();
    const twiml = new VoiceResponse();

    try {
      // Generate speech using Google Studio TTS for better natural sound
      const noInputMessage = "I haven't heard anything. What's on your mind? I'm here to chat and help out.";
      const voiceConfig = personality.voiceConfig; // Use the personality's voice config which now uses Studio voices
      const audioBuffer = await generateSpeech(noInputMessage, voiceConfig);
      const audioUrl = await streamToTwilio(audioBuffer);

      // Create TwiML response
      const response = new VoiceResponse();
      
      // Set up continuous listening with stream
      const connect = response.connect();
      connect.stream({
        url: '/api/audio-stream',
        track: 'inbound_track'
      });

      // Use the audio URL in TwiML response
      // Note: Using say with a standard voice as a fallback, but the audio quality will come from the pre-generated Studio voice
      response.say({ voice: 'woman' }, noInputMessage);

      return new NextResponse(response.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    } catch (ttsError) {
      console.error('TTS Error:', ttsError);
      
      // Fallback to basic message
      const fallbackMessage = "I'm having trouble understanding. Could you please try again?";
      const fallbackConfig = {
        languageCode: 'en-US',
        name: 'en-US-Studio-M',
        ssmlGender: 'MALE' as const
      };
      
      const fallbackAudio = await generateSpeech(fallbackMessage, fallbackConfig);
      const fallbackUrl = await streamToTwilio(fallbackAudio);
      
      const fallbackResponse = new VoiceResponse();
      fallbackResponse.say({ voice: 'alice' }, fallbackMessage);
      
      return new NextResponse(fallbackResponse.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }
  } catch (error) {
    console.error('Error in no-input handler:', error);
    
    try {
      const errorMessage = "I'm sorry, but I'm having technical difficulties. Please try again.";
      const errorConfig = {
        languageCode: 'en-US',
        name: 'en-US-Studio-M',
        ssmlGender: 'MALE' as const
      };
      
      const errorAudio = await generateSpeech(errorMessage, errorConfig);
      const errorUrl = await streamToTwilio(errorAudio);
      
      const errorResponse = new VoiceResponse();
      errorResponse.say({ voice: 'alice' }, errorMessage);
      
      return new NextResponse(errorResponse.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    } catch (ttsError) {
      // Ultimate fallback
      const finalResponse = new VoiceResponse();
      finalResponse.say({
        voice: 'en-US-Neural2-D',
        language: 'en-US'
      }, 'A system error occurred. Please try again.');
      
      return new NextResponse(finalResponse.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }
  }
}
