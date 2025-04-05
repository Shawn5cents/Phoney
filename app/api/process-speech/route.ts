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

    // Create a more appropriate AI prompt based on speech content
    // This incorporates personality info from the AI personalities system
    const prompt = `You are Michael, a human assistant who handles calls for Shawn. You have a friendly, professional tone.

GUIDELINES:
- Be brief and natural. Keep responses under 20 words like a real person would.
- Never say you're an AI. Simply identify as Shawn's assistant Michael.
- If asked about Shawn, explain he's not available but you're handling his calls.
- For transfers, get their callback number or take a message.
- Respond directly to exactly what was said - stay on topic.

User said: "${speechResult}"

Your response (brief and natural):`;
    
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
    
    // Basic Twilio TTS with natural settings
    twiml.say({
      voice: 'man',         // Male voice
      language: 'en-US'     // US English
    }, aiResponse || 'I apologize, but I didn\'t catch that clearly. How can I help you today?');
    
    // Add another pause
    twiml.pause({ length: 1 });
    
    // Set up next speech gathering - CRITICAL for keeping the call alive
    const nextGather = twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      timeout: 10,           // Give enough time for user to speak
      speechTimeout: 'auto', // Auto-detect end of speech
      speechModel: 'phone_call', // Optimized for phone calls
      enhanced: true,        // Better recognition
      language: 'en-US',     // Language setting
      hints: 'yes, no, maybe, thanks, goodbye, transfer, Shawn' // Recognition hints
    });
    
    // Add a natural-sounding follow-up prompt
    nextGather.say({
      voice: 'man',
      language: 'en-US'
    }, 'Anything else I can help you with today?');
    
    // Add a polite fallback message if no further input is received
    twiml.say({
      voice: 'man',
      language: 'en-US'
    }, 'Thank you for calling Phoney Assistant. Have a great day. Goodbye.');
    
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
