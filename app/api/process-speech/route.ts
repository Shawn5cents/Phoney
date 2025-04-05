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
  console.log('=== PROCESS SPEECH HANDLER ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('SIMPLIFIED VERSION FOR DEBUGGING');
  
  try {
    const formData = await request.formData();
    console.log('==== SPEECH INPUT DATA ====');
    console.log('Form data:', Object.fromEntries(formData.entries()));
    // Log keys and values in a TypeScript-friendly way
    const keys: string[] = [];
    const values: string[] = [];
    formData.forEach((value, key) => {
      keys.push(key);
      values.push(String(value));
    });
    console.log('Form data keys:', keys);
    console.log('Form data values:', values);
    
    const speechResult = formData.get('SpeechResult') as string;
    const callSid = formData.get('CallSid') as string;

    console.log('Speech result:', speechResult);
    console.log('Call SID:', callSid);

    if (!speechResult) {
      throw new Error('No speech result received');
    }

    // Use simplified prompt for now while debugging the call flow
    const prompt = `Respond as Michael, a human assistant who handles calls for Shawn.
Be brief, casual but professional. Keep responses under 20 words.
Never say you're AI. If asked about Shawn, say he's not available.

User: ${speechResult}
Assistant:`;
    
    console.log('Prompt:', prompt);
    console.log('Getting AI response...');
    // Get response with error handling
    let aiResponse;
    try {
      // Generate AI response using streaming
      aiResponse = '';
      for await (const chunk of streamGeminiResponse(prompt)) {
        aiResponse += chunk;
        // Send partial response through Pusher for real-time UI updates
        try {
          await pusherServer.trigger(`call-${callSid}`, 'partial-response', {
            text: chunk,
            sender: 'ai',
            timestamp: new Date().toISOString(),
          });
        } catch (pusherError) {
          console.warn('Pusher partial update failed:', pusherError);
          // Continue anyway
        }
      }
    } catch (aiError) {
      console.error('AI response generation failed:', aiError);
      aiResponse = "I'm sorry, I didn't catch that. How can I help you today?";
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

    // Respond with TwiML - using simplest approach for debugging
    const twiml = new VoiceResponse();
    
    // Add a small pause
    twiml.pause({ length: 1 });
    
    console.log('AI response:', aiResponse);
    
    // Just use basic Twilio TTS for reliability while debugging
    twiml.say({
      voice: 'man',
      language: 'en-US'
    }, aiResponse || 'I apologize, but I encountered an error. Please try again.');
    
    // Add another pause
    twiml.pause({ length: 1 });
    
    // Set up next speech gathering - CRITICAL for keeping call alive
    const nextGather = twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      timeout: 8,  // Wait for user to speak
    });
    
    // Add a simple prompt to gather more input
    nextGather.say('Anything else I can help with?');
    
    // Add a fallback if no input
    twiml.say('Thank you for calling. Goodbye.');
    
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
