import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { pusherServer } from '@/lib/pusher';
import { generateSpeech, streamToTwilio, VOICE_IDS } from '@/lib/google-advanced-tts';
import { streamGeminiResponse } from '@/lib/gemini';
import { personalities } from '@/lib/ai-personalities';
// Import initialization to ensure speech cache is ready
import { ensureInitialized } from '../_init';



const { VoiceResponse } = twilio.twiml;

export async function POST(request: Request) {
  console.log('Processing speech...');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  // Ensure speech cache is initialized
  try {
    await ensureInitialized();
    console.log('Speech cache ready for use');
  } catch (initError) {
    console.warn('Speech cache initialization may not be complete:', initError);
    // Continue anyway as we have fallbacks
  }
  
  try {
    const formData = await request.formData();
    console.log('Form data:', Object.fromEntries(formData.entries()));
    
    const speechResult = formData.get('SpeechResult') as string;
    const callSid = formData.get('CallSid') as string;

    console.log('Speech result:', speechResult);
    console.log('Call SID:', callSid);

    if (!speechResult) {
      throw new Error('No speech result received');
    }

    // Get AI response
    console.log('Getting AI response...');
    console.log('Speech received:', speechResult);

    // Select a default personality (friendly)
    const personality = personalities.friendly;
    
    // Build prompt with examples
    const examplesText = personality.examples
      .map(ex => `User: ${ex.input}\nAssistant: ${ex.response}`)
      .join('\n\n');

    const prompt = `You are Michael, Shawn's personal assistant. Be casual and friendly but professional. Never reveal you are AI. Keep responses brief and natural, like a real person would speak. If asked about Shawn, explain that he's not available but you handle his calls now. Keep responses under 30 words.

Example conversations:
User: "Can I speak to Shawn?"
Assistant: "He's not available right now. I'm Michael, his assistant - I handle his calls. What can I help you with?"

User: "Is Shawn there?"
Assistant: "Not right now. I'm his assistant Michael and I handle his calls. Need help with something?"

User: "I really need to talk to Shawn"
Assistant: "I get that, but I handle all his calls now. I can help or have him call you back. What's up?"

Current conversation:
User: ${speechResult}
Assistant:`;
    // Generate AI response using streaming
    let aiResponse = '';
    for await (const chunk of streamGeminiResponse(prompt)) {
      aiResponse += chunk;
      // Send partial response through Pusher for real-time UI updates
      await pusherServer.trigger(`call-${callSid}`, 'partial-response', {
        text: chunk,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      });
    }
    console.log('Complete AI response:', aiResponse);
    
    // Update transcript
    try {
      // Send user's speech
      await pusherServer.trigger(`call-${callSid}`, 'call.transcription', {
        text: speechResult,
        sender: 'user',
        timestamp: new Date().toISOString()
      });

      // Send AI's response
      await pusherServer.trigger(`call-${callSid}`, 'call.transcription', {
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      });
    } catch (pusherError) {
      console.error('Pusher error:', pusherError);
      // Continue anyway as this is not critical
    }

    // Respond with TwiML
    const twiml = new VoiceResponse();
    
    // Add a small pause
    twiml.pause({ length: 1 });
    
    // Set default transfer number
    process.env.DEFAULT_TRANSFER_NUMBER = '334-352-9695';
    if (!process.env.DEFAULT_TRANSFER_NUMBER) {
      process.env.DEFAULT_TRANSFER_NUMBER = '334-352-9695';
    }

    try {
      // Generate response using Google's premium voice
      console.log('Generating TTS response for:', aiResponse);
      const responseAudio = await generateSpeech(aiResponse!, {
        personalityType: 'FRIENDLY',
        gender: 'MALE'
      });
      
      // Check if we got a TwiML response (starts with <Response>)
      if (responseAudio.startsWith('<Response>')) {
        // If we got TwiML directly, return it instead of embedding it
        console.log('Received TwiML response directly, using it');
        return new NextResponse(responseAudio, {
          headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        });
      }
      
      // Otherwise, play the generated audio
      console.log('Processing audio through streamToTwilio');
      const playableAudio = await streamToTwilio(responseAudio);
      twiml.play(playableAudio);
    } catch (ttsError) {
      console.error('Error with TTS, falling back to basic Say:', ttsError);
      // Fall back to basic Twilio TTS
      twiml.say(aiResponse || 'I apologize, but I encountered an error. Please try again.');
    }
    
    // Add another pause
    twiml.pause({ length: 1 });
    
    // Set up next speech gathering - CRITICAL for keeping call alive
    const nextGather = twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US',
      timeout: 10,  // Longer timeout to prevent dropping call
    });
    
    // Add a simple prompt to gather more input
    nextGather.say({
      voice: 'man',
      language: 'en-US'
    }, 'Anything else I can help with?');
    
    // Add a fallback if no input
    twiml.say({
      voice: 'man',
      language: 'en-US'
    }, 'Thank you for calling. Goodbye.');
    
    // Log this call to ensure it's being processed
    console.log(`Processing speech for call ${callSid} complete. Waiting for next input.`);

    const response = twiml.toString();
    console.log('TwiML Response:', response);

    return new NextResponse(response, {
      headers: { 
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error processing speech:', error);
    
    const twiml = new VoiceResponse();
    // Generate error message using Google's premium voice
    const errorAudio = await generateSpeech('I apologize, but I encountered an error. Please try again.', {
      personalityType: 'PROFESSIONAL',
      gender: 'MALE'
    });
    
    // Play the error audio
    twiml.play(await streamToTwilio(errorAudio));
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}
