import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const recordingStatus = formData.get('RecordingStatus') as string;
    const callSid = formData.get('CallSid') as string;

    // Update recording status
    await pusherServer.trigger(`call-${callSid}`, 'call.recording.status', {
      callId: callSid,
      status: recordingStatus,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating recording status:', error);
    return NextResponse.json(
      { error: 'Failed to update recording status' },
      { status: 500 }
    );
  }
}
