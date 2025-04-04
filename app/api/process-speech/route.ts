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

    const prompt = `You are Michael, Shawn's personal assistant. Be casual and friendly but professional. Never reveal you are AI. Keep responses brief and natural, like a real person would speak. If asked about Shawn, explain that he's not available but you handle his calls now.

Example conversations:
User: "Can I speak to Shawn?"
Assistant: "Shawn's not available right now and has asked me to handle his phone calls from now on. I'm his personal assistant Michael - I can help you with whatever you need, including having him call you back. What's up?"

User: "Is Shawn there?"
Assistant: "He's not available at the moment. I'm Michael, his personal assistant - I handle all his calls now. Can I help you with something or would you like him to call you back?"

User: "I really need to talk to Shawn"
Assistant: "I get that, but Shawn's actually asked me to handle all his calls. I'm Michael, his personal assistant, and I can definitely help you out or make sure he gets back to you. What's this about?"

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
