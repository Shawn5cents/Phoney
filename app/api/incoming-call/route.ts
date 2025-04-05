import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import twilio from 'twilio';
// Import the new premium voice system
import { generateSpeech, streamToTwilio, VOICE_IDS } from '@/lib/google-advanced-tts';
// Import initialization to ensure speech cache is ready
import { ensureInitialized } from '../_init';

const { VoiceResponse } = twilio.twiml;

// Keep track of call state
const activeCallsMap = new Map<string, boolean>();

// Last updated: 2025-04-03 14:27
export async function POST(request: Request) {
  console.log('=== START INCOMING CALL HANDLER ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Node Version: ${process.version}`);
  console.log(`Memory Usage: ${JSON.stringify(process.memoryUsage())}`);
  console.log('Environment check:', {
    hasGoogleKey: !!process.env.GOOGLE_API_KEY,
    googleKeyLength: process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.length : 0,
    hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
  });
  
  // Ensure speech cache is initialized
  try {
    await ensureInitialized();
    console.log('Speech cache ready for use');
  } catch (initError) {
    console.warn('Speech cache initialization may not be complete:', initError);
    // Continue anyway as we have fallbacks
  }
  
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
    
    // SIMPLIFIED APPROACH: Use basic TTS for reliability
    const gather = twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      timeout: 10,
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      enhanced: true,
      language: 'en-US'
    });
    
    // Use simple TTS for greeting
    gather.say({
      voice: 'man',
      language: 'en-US'
    }, 'Hello, this is Phoney Assistant. How can I help you today?');
    
    // Handle no input
    twiml.say({
      voice: 'man',
      language: 'en-US'
    }, 'I didn\'t hear anything. Please call back when you\'re ready to talk.');
    
    // Log the TwiML we're sending
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
