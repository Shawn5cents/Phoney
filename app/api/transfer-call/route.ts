import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { amazonConnectConfig } from '@/lib/amazon-connect';

// Import Twilio using require to avoid TypeScript issues
const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const { callSid, transferNumber: requestedNumber, transferType = 'external' } = await request.json();
  // Use default number if none provided
  const transferNumber = requestedNumber || process.env.DEFAULT_TRANSFER_NUMBER || '334-352-9695';
  
  try {
    console.log(`Transferring call ${callSid} to ${transferNumber} (type: ${transferType})`);
    
    // Create TwiML to transfer the call
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twimlResponse = new VoiceResponse();
    
    // Add a message using Twilio's voice
    // Using a voice that's compatible with Twilio's type definitions
    twimlResponse.say(
      { voice: 'man' },
      'Please hold while I transfer you.'
    );
    
    // Handle different transfer types
    if (transferType === 'connect-internal') {
      // This is for transfers within Amazon Connect
      // We'll just notify Amazon Connect about the transfer request
      // The actual transfer happens within Amazon Connect
      
      // No need to update the Twilio call, just notify about the transfer
      console.log(`Internal Amazon Connect transfer requested to ${transferNumber}`);
    } 
    else if (transferType === 'connect-queue') {
      // Transfer to an Amazon Connect queue
      console.log(`Amazon Connect queue transfer requested to ${transferNumber}`);
      // Similar to internal transfer, this happens within Amazon Connect
    }
    else {
      // Standard external transfer using Twilio
      // Simple dial options
      const dialOptions = {
        callerId: process.env.TWILIO_CALLER_ID || transferNumber,
        // Maintain call quality during transfer
        answerOnBridge: true
      };
      
      // Create the dial element and add the number
      // Using the dial method directly
      const dial = twimlResponse.dial(dialOptions);
      dial.number(transferNumber);
      
      // Update the call with the new TwiML
      await client.calls(callSid)
        .update({
          twiml: twimlResponse.toString()
        });
    }
    
    // Notify about the transfer
    await Promise.all([
      // Notify the specific call channel
      pusherServer.trigger(`call-${callSid}`, 'call.transferred', {
        callId: callSid,
        transferredTo: transferNumber,
        transferType,
        timestamp: new Date().toISOString(),
        // Include info about whether this was handled by Amazon Connect
        handledBy: transferType.startsWith('connect') ? 'Amazon Connect' : 'Twilio'
      }),
      // Notify the main calls channel
      pusherServer.trigger('calls', 'call.transferred', {
        callId: callSid,
        transferredTo: transferNumber,
        transferType,
        handledBy: transferType.startsWith('connect') ? 'Amazon Connect' : 'Twilio'
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
