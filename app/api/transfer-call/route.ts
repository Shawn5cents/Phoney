import { NextResponse } from 'next/server';
import { Twilio } from 'twilio';
import { twiml } from 'twilio';
import { pusherServer } from '@/lib/pusher';
import { generateSpeech, streamToTwilio, VOICE_IDS } from '@/lib/google-advanced-tts';

// Properly initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const client = new Twilio(accountSid, authToken);

export async function POST(request: Request) {
  const { callSid, transferNumber: requestedNumber } = await request.json();
  // Use default number if none provided
  const transferNumber = requestedNumber || process.env.DEFAULT_TRANSFER_NUMBER || '334-352-9695';
  
  try {
    console.log(`Transferring call ${callSid} to ${transferNumber}`);
    
    // Create TwiML to transfer the call
    const VoiceResponse = twiml.VoiceResponse;
    const twimlResponse = new VoiceResponse();
    
    // Add a message using standard TwiML say verb
    // Note: We're using a standard voice here as TwiML doesn't directly support Google Studio voices
    // The actual voice quality will be determined by Twilio's implementation
    twimlResponse.say(
      { voice: 'Polly.Matthew' }, // Using Twilio's Polly voice for better quality
      'Please hold while I transfer you.'
    );
    
    // Dial the transfer number
    const dialElement = twimlResponse.dial();
    dialElement.number(transferNumber);
    
    // Update the call with the new TwiML
    await client.calls(callSid)
      .update({
        twiml: twimlResponse.toString()
      });
    
    // Notify about the transfer
    await Promise.all([
      // Notify the specific call channel
      pusherServer.trigger(`call-${callSid}`, 'call.transferred', {
        callId: callSid,
        transferredTo: transferNumber,
        timestamp: new Date().toISOString()
      }),
      // Notify the main calls channel
      pusherServer.trigger('calls', 'call.transferred', {
        callId: callSid,
        transferredTo: transferNumber
      })
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error transferring call:', error);
    return NextResponse.json(
      { error: 'Failed to transfer call' },
      { status: 500 }
    );
  }
}
