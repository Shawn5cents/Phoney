import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { pusherServer } from '@/lib/pusher';

const client = twilio(process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID
});

export async function POST(request: Request) {
  const { callId } = await request.json();

  try {
    // End the call gracefully
    await client.calls(callId)
      .update({
        twiml: new twilio.twiml.VoiceResponse()
          .say('Thank you for calling. Goodbye.')
          .hangup()
          .toString()
      });

    // Notify clients that the call has ended
    await pusherServer.trigger(`call-${callId}`, 'call.ended', {
      callId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending call:', error);
    return NextResponse.json(
      { error: 'Failed to end call' },
      { status: 500 }
    );
  }
}
