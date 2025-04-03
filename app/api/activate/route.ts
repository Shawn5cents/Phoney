import { NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID
});

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();

  try {
    // Format phone number to E.164 format
    const formattedPhoneNumber = phoneNumber.startsWith('+1') ? phoneNumber : `+1${phoneNumber}`;

    // Verify environment variables
    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('TWILIO_PHONE_NUMBER is not set');
    }
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      throw new Error('NEXT_PUBLIC_BASE_URL is not set');
    }

    // Update the Twilio number to forward to our webhook
    const numbers = await client.incomingPhoneNumbers.list({
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    });

    if (numbers.length === 0) {
      throw new Error(`No Twilio numbers found matching ${process.env.TWILIO_PHONE_NUMBER}`);
    }

    await Promise.all(
      numbers.map(number =>
        client.incomingPhoneNumbers(number.sid)
          .update({
            voiceUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/incoming-call`,
            voiceMethod: 'POST'
          })
      )
    );

    return NextResponse.json({ success: true, message: 'AI assistant activated successfully' });
  } catch (error: any) {
    console.error('Error activating AI assistant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate AI assistant' },
      { status: 500 }
    );
  }
}
