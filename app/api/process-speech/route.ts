import { NextResponse } from 'next/server';
import twilio from 'twilio';
import OpenAI from 'openai';
import { pusherServer } from '@/lib/pusher';
import { personalities } from '@/lib/ai-personalities';
import { getCurrentPersonality } from '@/lib/personality-store';


const { VoiceResponse } = twilio.twiml;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system' as const,
          content: personality.systemPrompt
        },
        ...personality.examples.flatMap(ex => [
          { role: 'user' as const, content: ex.input },
          { role: 'assistant' as const, content: ex.response }
        ]),
        { role: 'user' as const, content: speechResult },
      ],
    });

    const aiResponse = completion.choices[0].message.content;
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
    
    // Say the AI response
    twiml.say({ voice: 'Polly.Matthew', language: 'en-US' }, aiResponse!);
    
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
    twiml.say({ voice: 'Polly.Matthew', language: 'en-US' }, 'I apologize, but I encountered an error. Please try again.');
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}
