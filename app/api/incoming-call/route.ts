import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import twilio from 'twilio';
import { personalityStore } from '@/lib/personality-store';
import { headers } from 'next/headers';

const { VoiceResponse } = twilio.twiml;

export async function POST(request: Request) {
  console.log('=== START INCOMING CALL HANDLER ===');
  const timestamp = new Date().toISOString();
  
  try {
    const formData = await request.formData();
    const callerNumber = formData.get('From') as string;
    const callSid = formData.get('CallSid') as string;
    
    console.log('Call from:', callerNumber, 'SID:', callSid);

    // Get host for WebSocket connection
    const host = headers().get('host') || '';
    const protocol = process.env.NODE_ENV === 'development' ? 'ws' : 'wss';
    const wsUrl = `${protocol}://${host}/api/audio-stream?callSid=${callSid}`;

    // Initialize call in Pusher
    try {
      // Set initial personality
      const defaultPersonality = personalityStore.getPersonality('professional');

      await pusherServer.trigger('calls', 'call.started', {
        callId: callSid,
        caller: callerNumber,
        timestamp,
        personality: 'professional'
      });

      await pusherServer.trigger(`call-${callSid}`, 'call.initialized', {
        status: 'active',
        wsUrl,
        timestamp,
        personality: defaultPersonality.name
      });

      console.log('Call initialization successful');
    } catch (error) {
      console.error('Pusher notification failed:', error);
      // Continue with call even if notification fails
    }

    const twiml = new VoiceResponse();
    
    // Start media stream for real-time audio processing
    const connect = twiml.connect();
    connect.stream({
      name: 'Audio Stream',
      url: wsUrl,
      track: 'inbound_track'
    });

    // Set up initial voice interaction
    const gather = twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      enhanced: true,
      profanityFilter: false,
      language: 'en-US',
      hints: [
        'hello',
        'hi',
        'yes',
        'no',
        'help',
        'transfer',
        'operator',
        'goodbye'
      ].join(', ')
    });

    // Initial greeting with personality-specific voice
    const personality = personalityStore.getPersonality('professional');
    gather.say({
      voice: personality.voiceId,
      language: 'en-US'
    }, `${personality.name} here. How may I assist you today?`);

    // Fallback for no input
    twiml.say({
      voice: personality.voiceId,
      language: 'en-US'
    }, "I didn't catch that. Please try again.");

    // Log the generated TwiML for debugging
    const response = twiml.toString();
    console.log('Generated TwiML:', response);

    return new NextResponse(response, {
      headers: { 
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  } catch (error) {
    console.error('=== ERROR IN INCOMING CALL HANDLER ===');
    console.error('Error details:', error);
    
    try {
      const twiml = new VoiceResponse();
      twiml.say({
        voice: 'en-US-Neural2-D',
        language: 'en-US'
      }, 'I apologize, but I encountered a technical issue. Please try your call again.');
      
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      });
    } catch (twimlError) {
      console.error('Failed to generate error TwiML:', twimlError);
      return new NextResponse(
        '<Response><Say>A system error occurred. Please try again.</Say></Response>', 
        { headers: { 'Content-Type': 'text/xml; charset=utf-8' } }
      );
    }
  } finally {
    console.log('=== END INCOMING CALL HANDLER ===');
  }
}
