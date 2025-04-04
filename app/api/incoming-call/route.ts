import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import twilio from 'twilio';
import { generateSpeech, streamToTwilio, voices } from '@/lib/unreal-speech';

const { VoiceResponse } = twilio.twiml;

// Last updated: 2025-04-03 14:27
export async function POST(request: Request) {
  console.log('=== START INCOMING CALL HANDLER ===');
  
  try {
    console.log('Parsing incoming call data...');
    const formData = await request.formData();
    const callerNumber = formData.get('From') as string;
    const callSid = formData.get('CallSid') as string;
    console.log('Call from:', callerNumber, 'SID:', callSid);

    // Notify dashboard of new call
    try {
      // Notify the main dashboard channel
      await pusherServer.trigger('calls', 'call.started', {
        callId: callSid,
        caller: callerNumber
      });

      // Notify the specific call channel
      await pusherServer.trigger(`call-${callSid}`, 'call.started', {
        callId: callSid,
        caller: callerNumber,
        status: 'active',
        timestamp: new Date().toISOString()
      });
      console.log('Dashboard notified successfully');
    } catch (pusherError) {
      console.error('Dashboard notification failed:', pusherError);
      // Continue with call even if notification fails
    }
    
    console.log('Creating TwiML response...');
    const twiml = new VoiceResponse();
    
    console.log('Generating greeting...');
    const welcomeAudio = await generateSpeech('Hi, this is Michael, Shawn\'s personal assistant. I help manage his calls and schedule. What can I assist you with today?', {
      VoiceId: 'Jasper',
      Speed: -0.1, // Slightly slower for more natural pace
      Pitch: 0.95, // More natural pitch
      Bitrate: '320k' // Higher quality audio
    });
    
    const audioUrl = await streamToTwilio(welcomeAudio);
    console.log('=== AUDIO URL DETAILS ===');
    console.log('Audio URL to play:', audioUrl);
    
    // Play the greeting and gather speech
    const gather = twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      enhanced: true
    });
    
    gather.play(audioUrl);
    
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
      // Generate error message using Unreal Speech
      const errorAudio = await generateSpeech('I apologize, but I encountered a technical issue. Please try your call again.', {
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
    } catch (twimlError) {
      console.error('Failed to generate error TwiML:', twimlError);
      return new NextResponse('<Response><Say>A system error occurred. Please try again.</Say></Response>', {
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      });
    }
  }
  finally {
    console.log('Response sent, ending call handler');
    console.log('=== END INCOMING CALL HANDLER ===');
  }
}
