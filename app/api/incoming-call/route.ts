import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import twilio from 'twilio';
// Import the new premium voice system
import { generateSpeech, streamToTwilio, VOICE_IDS } from '@/lib/google-advanced-tts';
// Import initialization to ensure speech cache is ready
import { ensureInitialized } from '../_init';

const { VoiceResponse } = twilio.twiml;

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
    
    console.log('=== GENERATING GREETING ===');
    console.log('Using optimized voice settings with PROFESSIONAL personality');
    console.log('About to call generateSpeech with text: "Hello?"');
    
    // Use consistent voice with professional personality settings
    try {
      console.log('Calling generateSpeech...');
      const welcomeAudio = await generateSpeech('Hello?', {
        personalityType: 'PROFESSIONAL',
        gender: 'MALE'
        // Using personality defaults for all other settings
      });
      console.log('generateSpeech completed successfully');
      console.log('Audio URL type:', typeof welcomeAudio, 'Length:', welcomeAudio.length);
      console.log('Audio URL preview:', welcomeAudio.substring(0, 50) + '...');
      
      // Check if we got a TwiML response directly
      if (welcomeAudio.startsWith('<Response>')) {
        console.log('Received direct TwiML response, returning it');
        return new NextResponse(welcomeAudio, {
          headers: { 
            'Content-Type': 'text/xml; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        });
      }
    
      const audioUrl = await streamToTwilio(welcomeAudio);
      console.log('=== AUDIO URL DETAILS ===');
      console.log('Audio URL to play type:', typeof audioUrl);
      console.log('Audio URL to play length:', audioUrl.length);
      console.log('Audio URL to play preview:', audioUrl.substring(0, 50) + '...');
    
      // Start gathering speech immediately after greeting
      const gather = twiml.gather({
        input: ['speech'],
        action: '/api/process-speech',
        method: 'POST',
        timeout: 10,  // Wait up to 10 seconds for input to begin
        speechTimeout: 'auto',  // Wait for natural pause in speech
        speechModel: 'phone_call',
        enhanced: true,
        profanityFilter: false,  // Don't filter any speech
        language: 'en-US'
      });

      // Play initial hello within gather
      console.log('Adding play command to TwiML within gather');
      gather.play(audioUrl);

      // Add a no-input handler with follow-up
      twiml.redirect({
        method: 'POST'
      }, '/api/no-input');
    } catch (speechError) {
      console.error('Error generating or streaming speech:', speechError);
      // Fall back to basic TwiML if TTS fails
      console.log('Falling back to basic TwiML Say verb');
      const gather = twiml.gather({
        input: ['speech'],
        action: '/api/process-speech',
        method: 'POST',
        speechTimeout: 'auto',
        speechModel: 'phone_call',
        enhanced: true
      });
      gather.say('Hello? This is an automated assistant. How can I help you today?');
      
      // Add a no-input handler
      twiml.redirect({
        method: 'POST'
      }, '/api/no-input');
    }
    
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
