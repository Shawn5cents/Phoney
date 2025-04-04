import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const recordingUrl = formData.get('RecordingUrl') as string;
    const callSid = formData.get('CallSid') as string;
    const duration = formData.get('RecordingDuration') as string;

    // Save recording info to database or storage
    // For now, we'll just notify the dashboard
    await pusherServer.trigger(`call-${callSid}`, 'call.recording', {
      callId: callSid,
      recordingUrl,
      duration,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving recording:', error);
    return NextResponse.json(
      { error: 'Failed to save recording' },
      { status: 500 }
    );
  }
}
