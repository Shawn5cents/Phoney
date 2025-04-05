import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { pusherServer } from '@/lib/pusher';
import { generateSpeech, streamToTwilio } from '@/lib/google-advanced-tts';
import { streamGeminiResponse } from '@/lib/gemini';
import { personalityStore } from '@/lib/personality-store';

const { VoiceResponse } = twilio.twiml;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const speechResult = formData.get('SpeechResult');
    const confidence = formData.get('Confidence');
    const callSid = formData.get('CallSid');

    if (!speechResult || !callSid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current personality
    const currentPersonality = personalityStore.getCurrentPersonality();

    // Notify of speech recognition
    await pusherServer.trigger(`call-${callSid}`, 'speech.received', {
      text: speechResult,
      confidence: parseFloat(confidence as string) || 0,
      timestamp: new Date().toISOString()
    });

    // Generate AI response
    const response = await streamGeminiResponse(
      speechResult as string,
      [], // Context could be stored per call
      currentPersonality
    );

    // Generate speech from response using Studio voices
    const audioBuffer = await generateSpeech(response, {
      languageCode: 'en-US',
      name: currentPersonality.voiceConfig.name, // Use the voice config from personality
      ssmlGender: currentPersonality.voiceConfig.ssmlGender
    });

    const audioUrl = await streamToTwilio(audioBuffer);

    // Create TwiML response
    const twiml = new VoiceResponse();

    // Set up gathering of next speech input
    const gather = twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      enhanced: true
    });

    // Play the AI response
    gather.say({
      language: 'en-US',
      voice: currentPersonality.voiceId
    }, response);

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error processing speech:', error);
    
    const twiml = new VoiceResponse();
    twiml.say({
      language: 'en-US',
      voice: 'en-US-Neural2-D'
    }, 'I apologize, but I encountered an error. Could you please repeat that?');

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}
