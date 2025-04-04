import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { pusherServer } from '@/lib/pusher';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(request: Request) {
  const { callSid } = await request.json();

  try {
    // End the call gracefully
    await client.calls(callSid)
      .update({
        twiml: new twilio.twiml.VoiceResponse()
          .say('Thank you for calling. Goodbye.')
          .hangup()
          .toString()
      });

    // Notify both channels that the call has ended
    await Promise.all([
      // Notify the specific call channel
      pusherServer.trigger(`call-${callSid}`, 'call.ended', {
        callId: callSid,
        timestamp: new Date().toISOString()
      }),
      // Notify the main calls channel
      pusherServer.trigger('calls', 'call.ended', {
        callId: callSid
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending call:', error);
    return NextResponse.json(
      { error: 'Failed to end call' },
      { status: 500 }
    );
  }
}
