import { pusherServer } from './pusher';
import { AIPersonalityConfig } from './voice-processing';

interface CallEventData {
  callSid: string;
  callerNumber: string;
  timestamp: string;
  personality: string;
}

/**
 * Manages call-related Pusher events
 */
export class CallEventManager {
  /**
   * Initializes a new call in the system
   */
  static async initializeCall(data: CallEventData, personality: AIPersonalityConfig) {
    const { callSid, callerNumber, timestamp } = data;

    // Trigger call started event
    await pusherServer.trigger('calls', 'call-started', {
      callSid,
      callerNumber,
      timestamp,
      status: 'in-progress',
      personality: personality.name
    });

    // Set initial personality
    await pusherServer.trigger(`call-${callSid}`, 'personality-changed', {
      timestamp,
      personality
    });

    // Set initial call status
    await pusherServer.trigger(`call-${callSid}`, 'call-updated', {
      timestamp,
      status: 'in-progress',
      callerNumber,
      activePersonality: personality.name
    });
  }

  /**
   * Updates the call status
   */
  static async updateCallStatus(callSid: string, status: string, timestamp: string) {
    await pusherServer.trigger(`call-${callSid}`, 'call-updated', {
      timestamp,
      status
    });
  }

  /**
   * Updates the active personality for a call
   */
  static async updateCallPersonality(callSid: string, personality: AIPersonalityConfig, timestamp: string) {
    await pusherServer.trigger(`call-${callSid}`, 'personality-changed', {
      timestamp,
      personality
    });
  }
}
