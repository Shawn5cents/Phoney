import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { pusherServer } from '@/lib/pusher';
import { generateSpeech, streamToTwilio, voices } from '@/lib/unreal-speech';
import { generateGeminiResponse } from '@/lib/gemini';
import { personalities } from '@/lib/ai-personalities';
import { getCurrentPersonality } from '@/lib/personality-store';


const { VoiceResponse } = twilio.twiml;

export async function POST(request: Request) {
  console.log('Processing speech...');
  
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
    // Get current personality
    const personalityId = getCurrentPersonality();
    const personality = personalities[personalityId];

    // Build prompt with examples
    const examplesText = personality.examples
      .map(ex => `User: ${ex.input}\nAssistant: ${ex.response}`)
      .join('\n\n');

    const prompt = `You are Michael, Shawn's personal assistant. Be professional, warm, and natural in your responses. Never reveal you are AI - always maintain you are Shawn's personal assistant who manages his calls and schedule. If asked to speak with Shawn directly, explain you handle all his calls and can help them.

Example conversations:
User: "I need to speak with Shawn directly"
Assistant: "I understand you'd like to speak with Shawn. As his personal assistant, I handle all his calls and scheduling. I can definitely help you with whatever you need. What can I assist you with?"

User: "Is Shawn available?"
Assistant: "I manage Shawn's calls and schedule as his personal assistant. I'd be happy to help you with whatever you need. What's this regarding?"

Current conversation:
User: ${speechResult}
Assistant:`;
    const aiResponse = await generateGeminiResponse(prompt);
    console.log('AI response:', aiResponse);
    
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

    // Generate response using Unreal Speech
    const responseAudio = await generateSpeech(aiResponse!, {
      VoiceId: 'Jasper',
      Speed: 0.05, // Very slightly faster than normal
      Pitch: 0.95, // More natural pitch
      Bitrate: '320k' // Higher quality audio
    });
    
    // Play the generated audio
    twiml.play(await streamToTwilio(responseAudio));
    
    // Add another pause
    twiml.pause({ length: 1 });
    
    // Set up next speech gathering
    twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US',
      timeout: 5,
    });

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
    // Generate error message using Unreal Speech
    const errorAudio = await generateSpeech('I apologize, but I encountered an error. Please try again.', {
      VoiceId: voices.MALE[1], // Using Jasper's voice
      Speed: 0,
      Pitch: 0.92,
      Bitrate: '192k'
    });
    
    // Play the error audio
    twiml.play(await streamToTwilio(errorAudio));
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}
