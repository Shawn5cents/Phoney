import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

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
    if (transferType === 'internal') {
      // Internal transfer to another department or agent
      console.log(`Internal transfer requested to ${transferNumber}`);
      
      // Use a special greeting for internal transfers
      twimlResponse.say(
        { voice: 'woman' },
        'Transferring you to an internal department. Please hold.'
      );
    } 
    else if (transferType === 'queue') {
      // Transfer to a queue
      console.log(`Queue transfer requested to ${transferNumber}`);
      twimlResponse.say(
        { voice: 'woman' },
        'Transferring you to a queue. Your call is important to us.'
      );
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
        // Always handled by Twilio
        handledBy: 'Twilio'
      }),
      // Notify the main calls channel
      pusherServer.trigger('calls', 'call.transferred', {
        callId: callSid,
        transferredTo: transferNumber,
        transferType,
        handledBy: 'Twilio'
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
