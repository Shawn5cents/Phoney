import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import twilio from 'twilio';

const { VoiceResponse } = twilio.twiml;

// Last updated: 2025-04-04 23:56
export async function POST(request: Request) {
  console.log('=== START INCOMING CALL HANDLER ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('SIMPLIFIED VERSION FOR DEBUGGING');
  
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
    
    console.log('Creating ULTRA SIMPLE TwiML response...');
    const twiml = new VoiceResponse();
    
    // Start with a simple say verb
    twiml.say('Hello, this is Phoney Assistant.');
    
    // Add a pause
    twiml.pause({ length: 1 });
    
    // Now gather the speech
    const gather = twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      timeout: 5
    });
    
    // Add a prompt within the gather
    gather.say('How can I help you today?');
    
    // Add a fallback for no input
    twiml.say('I didn\'t hear anything. Goodbye.');
    
    // Convert to string and log
    const response = twiml.toString();
    console.log('ULTRA SIMPLE TwiML:', response);


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
      
      // Skip trying to use advanced TTS in error handler to avoid recursion
      // Just use Twilio's built-in TTS which is more reliable
      twiml.say('I apologize, but I encountered a technical issue. Please try your call again.');
      
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
