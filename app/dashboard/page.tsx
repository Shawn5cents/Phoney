'use client';

import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';

interface Call {
  callSid: string;
  callerNumber: string;
  transcript: Array<{
    speaker: 'User' | 'AI';
    text: string;
  }>;
}

export default function Dashboard() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeCalls, setActiveCalls] = useState<Record<string, Call>>({});
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('calls');
    
    channel.bind('new-call', (data: Call) => {
      setActiveCalls(prev => ({ ...prev, [data.callSid]: data }));
    });

    channel.bind('call-update', (data: { callSid: string; transcript: Call['transcript'] }) => {
      setActiveCalls(prev => ({
        ...prev,
        [data.callSid]: {
          ...prev[data.callSid],
          transcript: data.transcript,
        },
      }));
    });

    return () => {
      pusher.unsubscribe('calls');
      pusher.disconnect();
    };
  }, []);

  const activateAIAssistant = async () => {
    try {
      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) throw new Error('Failed to activate');
      
      setIsActivated(true);
      alert('AI Assistant activated successfully!');
    } catch (error) {
      alert('Failed to activate AI Assistant. Please try again.');
    }
  };

  const takeOverCall = async (callSid: string) => {
    try {
      await fetch('/api/take-over-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callSid, phoneNumber }),
      });
      
      alert('Taking over call...');
    } catch (error) {
      alert('Failed to take over call. Please try again.');
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Call Assistant Dashboard</h1>
        
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Setup</h2>
          <div className="flex gap-4">
            <input
              type="tel"
              placeholder="Enter your phone number"
              className="flex-1 p-2 border rounded"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button 
              onClick={activateAIAssistant}
              className={`px-6 py-2 rounded ${
                isActivated 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
            >
              {isActivated ? 'Activated' : 'Activate AI Assistant'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Active Calls</h2>
          {Object.keys(activeCalls).length === 0 ? (
            <p className="text-gray-500">No active calls</p>
          ) : (
            Object.entries(activeCalls).map(([callSid, call]) => (
              <div key={callSid} className="p-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium">Call from: {call.callerNumber}</h3>
                    <p className="text-sm text-gray-500">SID: {callSid}</p>
                  </div>
                  <button
                    onClick={() => takeOverCall(callSid)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Take Over Call
                  </button>
                </div>
                
                <div className="space-y-2">
                  {call.transcript?.map((line, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded ${
                        line.speaker === 'AI' 
                          ? 'bg-blue-50 ml-4' 
                          : 'bg-gray-50 mr-4'
                      }`}
                    >
                      <span className="font-medium">{line.speaker}:</span> {line.text}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
