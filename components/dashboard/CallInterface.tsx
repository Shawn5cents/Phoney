'use client';

import { useEffect, useRef, useState } from 'react';
import { Device } from '@twilio/voice-sdk';

interface CallInterfaceProps {
  callId?: string;
  onClose: () => void;
}

export function CallInterface({ callId, onClose }: CallInterfaceProps) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const deviceRef = useRef<Device>();

  useEffect(() => {
    if (!callId) return;

    const setupDevice = async () => {
      try {
        // Get Twilio token
        const response = await fetch('/api/get-twilio-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callId })
        });
        
        if (!response.ok) throw new Error('Failed to get token');
        const { token } = await response.json();

        // Initialize Twilio device
        const device = new Device(token, {
          edge: ['ashburn'],
          maxAverageBitrate: 16000
        });

        deviceRef.current = device;

        // Connect to the call
        const connection = await device.connect({
          params: { callId }
        });

        connection.on('disconnect', () => {
          onClose();
        });

        setStatus('connected');
      } catch (error) {
        console.error('Error setting up call:', error);
        setStatus('error');
      }
    };

    setupDevice();

    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
      }
    };
  }, [callId, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96">
        <div className="text-center">
          <div className="mb-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              status === 'connected' ? 'bg-green-100' : 
              status === 'error' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={status === 'connected' ? 
                    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" :
                    status === 'error' ?
                    "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" :
                    "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  } 
                />
              </svg>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-2">
            {status === 'connected' ? 'Connected to Call' :
             status === 'error' ? 'Connection Failed' :
             'Connecting to Call...'}
          </h3>
          
          <p className="text-gray-500 text-sm mb-4">
            {status === 'connected' ? 'You are now speaking with the caller' :
             status === 'error' ? 'Unable to connect to the call' :
             'Setting up your connection...'}
          </p>

          <div className="flex justify-center space-x-3">
            {status === 'connected' && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                End Call
              </button>
            )}
            {status === 'error' && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
