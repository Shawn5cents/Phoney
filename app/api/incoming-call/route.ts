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
    
    // Start recording the call
    twiml.record({
      action: '/api/save-recording',
      method: 'POST',
      recordingStatusCallback: '/api/recording-status',
      recordingStatusCallbackMethod: 'POST',
      trim: 'trim-silence'
    });

    // Generate Tre's greeting using Unreal Speech (Jasper's voice)
    const welcomeAudio = await generateSpeech('Hello, this is Tre, Shawn\'s personal assistant. He asked me to take his calls for him.', {
      VoiceId: 'Jasper', // Using Jasper's voice for Tre
      Speed: 0,
      Pitch: 0.92,
      Bitrate: '192k'
    });
    
    // Play the generated audio
    twiml.play(await streamToTwilio(welcomeAudio));

    // Start gathering speech input with a timeout
    const gather = twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      enhanced: true,
      timeout: 5
    });

    // If no response, say hello again
    const followUpAudio = await generateSpeech('Hello? This is Tre, Shawn\'s personal assistant. Is anyone there?', {
      VoiceId: 'Jasper',
      Speed: 0,
      Pitch: 0.92,
      Bitrate: '192k'
    });
    
    twiml.play(await streamToTwilio(followUpAudio));
    
    // Try gathering speech again
    const secondGather = twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      enhanced: true
    });

    // Generate timeout message using Unreal Speech
    const timeoutAudio = await generateSpeech('I didn\'t hear anything. Please call back if you need assistance.', {
      VoiceId: voices.MALE[1], // Using Jasper's voice
      Speed: 0,
      Pitch: 0.92,
      Bitrate: '192k'
    });
    
    // Play the generated audio
    twiml.play(await streamToTwilio(timeoutAudio));
    
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
    console.log('=== END INCOMING CALL HANDLER ===');
  }
}
