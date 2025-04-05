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
    
    // IMPROVED APPROACH: Make gather the top-level verb
    // Speech recognition works better when the gather is the top-level verb
    const gather = twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      timeout: 15,              // Give more time to start speaking
      speechTimeout: 'auto',    // Auto-detect end of speech
      speechModel: 'phone_call',// Phone-optimized model
      enhanced: true,          // Better recognition quality
      profanityFilter: false,   // Capture everything
      language: 'en-US',       // Specify language
      hints: 'hello, hi, yes, no, help, Shawn' // Common words to help recognition
    });
    
    // Put greeting inside the gather
    gather.say({
      voice: 'man',
      language: 'en-US'
    }, 'Hello, this is Phoney Assistant. How can I help you today?');
    
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
