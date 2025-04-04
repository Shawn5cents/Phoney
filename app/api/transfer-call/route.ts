import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { pusherServer } from '@/lib/pusher';
import { generateSpeech, streamToTwilio, voices } from '@/lib/unreal-speech';

const client = twilio(process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID
});

export async function POST(request: Request) {
  const { callSid, transferNumber: requestedNumber } = await request.json();
  // Use default number if none provided
  const transferNumber = requestedNumber || process.env.DEFAULT_TRANSFER_NUMBER || '334-352-9695';
  
  try {
    console.log(`Transferring call ${callSid} to ${transferNumber}`);
    
    // Create TwiML to transfer the call
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Generate transfer message using Unreal Speech
    const transferAudio = await generateSpeech('Please hold while I transfer you.', {
      VoiceId: voices.MALE[1], // Using Jasper's voice
      Speed: 0,
      Pitch: 0.92,
      Bitrate: '192k'
    });
    
    // Play the generated audio
    twiml.play(await streamToTwilio(transferAudio));
    
    // Dial the transfer number
    twiml.dial().number(transferNumber);
    
    // Update the call with the new TwiML
    await client.calls(callSid)
      .update({
        twiml: twiml.toString()
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
