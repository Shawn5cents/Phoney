import Pusher from 'pusher';

// Initialize Pusher client for server-side use
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true
});

/**
 * Send a transcription event to the dashboard
 */
export async function sendTranscription(callSid: string, text: string, sender: 'user' | 'ai'): Promise<void> {
  try {
    // Send to the specific call channel
    await pusherServer.trigger(`call-${callSid}`, 'call.transcription', {
      text,
      sender,
      timestamp: new Date().toISOString()
    });

    console.log(`Transcription sent to call-${callSid} from ${sender}`);
  } catch (error) {
    console.error('Failed to send transcription via Pusher:', error);
    // Don't throw - Pusher errors shouldn't break the call flow
  }
}

/**
 * Notify dashboard of a new call
 */
export async function notifyNewCall(callSid: string, callerNumber: string): Promise<void> {
  try {
    // Notify the main dashboard channel
    await pusherServer.trigger('calls', 'call.started', {
      callId: callSid,
      caller: callerNumber
    });

    // Notify the specific call channel
    await pusherServer.trigger(`call-${callSid}`, 'call.started', {
      callId: callSid,
      caller: callerNumber,
      status: 'active',
      timestamp: new Date().toISOString()
    });

    console.log(`New call notification sent for ${callSid}`);
  } catch (error) {
    console.error('Failed to send call notification via Pusher:', error);
  }
}

/**
 * Update call status
 */
export async function updateCallStatus(callSid: string, status: string, details?: any): Promise<void> {
  try {
    // Update the main dashboard channel
    await pusherServer.trigger('calls', 'call.status', {
      callId: callSid,
      status,
      timestamp: new Date().toISOString(),
      ...details
    });

    // Update the specific call channel
    await pusherServer.trigger(`call-${callSid}`, 'call.status', {
      status,
      timestamp: new Date().toISOString(),
      ...details
    });

    console.log(`Call status updated to ${status} for ${callSid}`);
  } catch (error) {
    console.error('Failed to update call status via Pusher:', error);
  }
}

export { pusherServer };
