import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { SayAttributes } from 'twilio/lib/twiml/VoiceResponse';
import { pusherServer } from '@/lib/pusher';
import { generateSpeech, streamToTwilio } from '@/lib/google-advanced-tts';
import { streamGeminiResponse } from '@/lib/gemini';
import { personalityStore } from '@/lib/personality-store';
import { getTwilioVoiceConfig, getVoiceConfigFromPersonality } from '@/lib/voice-processing';

const { VoiceResponse } = twilio.twiml;

// Default response for error handling
const DEFAULT_ERROR_MESSAGE = 'I apologize, but I encountered an error. Could you please repeat that?';

/**
 * Process speech from Twilio and generate AI response
 */
export async function POST(request: Request) {
  console.log('=== START PROCESS SPEECH HANDLER ===');
  
  try {
    // Parse form data from Twilio
    const formData = await request.formData();
    const speechResult = formData.get('SpeechResult');
    const confidence = formData.get('Confidence');
    const callSid = formData.get('CallSid');
    const personalityId = new URL(request.url).searchParams.get('personalityId');

    // Validate required fields
    if (!speechResult || !callSid) {
      console.error('Missing required fields:', { speechResult, callSid });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`Processing speech for call ${callSid}:`, {
      speechResult,
      confidence: confidence || 'unknown',
      personalityId: personalityId || 'default'
    });

    // Get current personality (use specified personality ID if available)
    const currentPersonality = personalityId
      ? personalityStore.getPersonality(personalityId)
      : personalityStore.getCurrentPersonality();

    // Notify of speech recognition via Pusher
    await pusherServer.trigger(`call-${callSid}`, 'speech.received', {
      text: speechResult,
      confidence: parseFloat(confidence as string) || 0,
      timestamp: new Date().toISOString(),
      personality: currentPersonality.name
    });

    // Generate AI response using Gemini
    const response = await streamGeminiResponse(
      speechResult as string,
      [], // Context could be stored per call
      currentPersonality
    );

    // Log the AI response
    console.log(`AI response generated for call ${callSid}:`, {
      responseLength: response.length,
      personality: currentPersonality.name
    });

    // Notify of AI response via Pusher
    await pusherServer.trigger(`call-${callSid}`, 'ai.response', {
      text: response,
      timestamp: new Date().toISOString(),
      personality: currentPersonality.name
    });

    // Generate speech from response using voice configuration
    const googleVoiceConfig = getVoiceConfigFromPersonality(currentPersonality);
    const audioBuffer = await generateSpeech(response, googleVoiceConfig);
    
    if (!audioBuffer) {
      throw new Error('Failed to generate speech audio');
    }

    // Create TwiML response
    const twiml = new VoiceResponse();

    // Get Twilio voice configuration
    const twilioVoiceConfig = getTwilioVoiceConfig(currentPersonality.voiceConfig);
    const sayAttrs: SayAttributes = {
      voice: twilioVoiceConfig.voice as 'woman' | 'man',
      language: twilioVoiceConfig.language
    };

    // Set up gathering of next speech input
    const gather = twiml.gather({
      input: ['speech'],
      action: `/api/process-speech?callSid=${callSid}&personalityId=${currentPersonality.name}`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      enhanced: true
    });

    // Play the AI response with the appropriate voice
    gather.say(sayAttrs, response);

    // Return TwiML response
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error processing speech:', error);
    
    // Create error response
    const twiml = new VoiceResponse();
    
    // Use default voice for error messages
    twiml.say({
      language: 'en-US',
      voice: 'woman'
    }, DEFAULT_ERROR_MESSAGE);

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      status: 500
    });
  } finally {
    console.log('=== END PROCESS SPEECH HANDLER ===');
  }
}
