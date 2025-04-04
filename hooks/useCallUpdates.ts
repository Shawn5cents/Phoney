import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/pusher';

export interface CallUpdate {
  callId: string;
  status: 'active' | 'ended';
  transcript?: {
    text: string;
    sender: 'ai' | 'user';
  };
}

export function useCallUpdates(callId?: string) {
  const [activeCall, setActiveCall] = useState<CallUpdate | null>(null);
  const [transcripts, setTranscripts] = useState<Array<{
    id: string;
    text: string;
    sender: 'ai' | 'user';
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    if (!callId) return;

    // Subscribe to call events
    const channel = pusherClient.subscribe(`call-${callId}`);

    channel.bind('call.started', (data: CallUpdate) => {
      setActiveCall(data);
    });

    channel.bind('call.transcription', (data: {
      text: string;
      sender: 'ai' | 'user';
    }) => {
      setTranscripts(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        text: data.text,
        sender: data.sender,
        timestamp: new Date()
      }]);
    });

    channel.bind('call.ended', () => {
      setActiveCall(null);
      pusherClient.unsubscribe(`call-${callId}`);
    });

    return () => {
      pusherClient.unsubscribe(`call-${callId}`);
    };
  }, [callId]);

  const takeOverCall = async () => {
    if (!callId) return;
    
    try {
      const response = await fetch('/api/take-over-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callSid: callId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to take over call');
      }
    } catch (error) {
      console.error('Error taking over call:', error);
    }
  };

  const endCall = async () => {
    if (!callId) return;
    
    try {
      const response = await fetch('/api/end-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callSid: callId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to end call');
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  return {
    activeCall,
    transcripts,
    takeOverCall,
    endCall
  };
}
