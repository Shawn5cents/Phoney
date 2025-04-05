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
    
      const audioUrl = await streamToTwilio(welcomeAudio);
      console.log('=== AUDIO URL DETAILS ===');
      console.log('Audio URL to play type:', typeof audioUrl);
      console.log('Audio URL to play length:', audioUrl.length);
      console.log('Audio URL to play preview:', audioUrl.substring(0, 50) + '...');
    
      // Play initial hello
      console.log('Adding play command to TwiML');
      twiml.play(audioUrl);
    } catch (speechError) {
      console.error('Error generating or streaming speech:', speechError);
      // Fall back to basic TwiML if TTS fails
      console.log('Falling back to basic TwiML Say verb');
      twiml.say('Hello? This is an automated assistant. How can I help you today?');
    }
    
    // Wait 2 seconds
    twiml.pause({ length: 2 });
    
    // Follow up if no response - use same personality for consistency
    const followUpAudio = await generateSpeech('Hello? Anyone there?', {
      personalityType: 'PROFESSIONAL',
      gender: 'MALE'
      // Using same voice throughout the call for natural experience
    });
    
    // Gather speech after follow-up
    const gather = twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      enhanced: true
    });
    
    gather.play(await streamToTwilio(followUpAudio));
    
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
      // Generate error message using optimized voice settings
      const errorAudio = await generateSpeech('I apologize, but I encountered a technical issue. Please try your call again.', {
        personalityType: 'PROFESSIONAL', // Maintain same personality as main flow
        gender: 'MALE'
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
