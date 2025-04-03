import { NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID
});

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();

  try {
    // Update the Twilio number to forward to our webhook
    await client.incomingPhoneNumbers
      .list({ phoneNumber: process.env.TWILIO_PHONE_NUMBER })
      .then(numbers => {
        return Promise.all(
          numbers.map(number =>
            client.incomingPhoneNumbers(number.sid)
              .update({
                voiceUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/incoming-call`
              })
          )
        );
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error activating AI assistant:', error);
    return NextResponse.json(
      { error: 'Failed to activate AI assistant' },
      { status: 500 }
    );
  }
}
