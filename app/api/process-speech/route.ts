import { NextResponse } from 'next/server';
import twilio from 'twilio';
import OpenAI from 'openai';
import { pusherServer } from '@/lib/pusher';


const { VoiceResponse } = twilio.twiml;
const openai = new OpenAI();

export async function POST(request: Request) {
  const formData = await request.formData();
  const speechResult = formData.get('SpeechResult') as string;
  const callSid = formData.get('CallSid') as string;

  try {
    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI phone assistant. Keep responses concise and natural.',
        },
        { role: 'user', content: speechResult },
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Update transcript
    await pusherServer.trigger('calls', 'call-update', {
      callSid,
      transcript: [
        { speaker: 'User', text: speechResult },
        { speaker: 'AI', text: aiResponse },
      ],
    });

    // Respond with TwiML using Twilio's text-to-speech
    const twiml = new VoiceResponse();
    twiml.say({ voice: 'Polly.Amy' }, aiResponse!);
    
    twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US',
    });

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error processing speech:', error);
    
    const twiml = new VoiceResponse();
    twiml.say('I apologize, but I encountered an error. Please try again.');
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
