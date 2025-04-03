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

export default function Home() {
  const [activeCalls, setActiveCalls] = useState<Record<string, Call>>({});
  const [selectedCall, setSelectedCall] = useState<string | null>(null);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('calls');
    
    channel.bind('new-call', (data: Call) => {
      setActiveCalls(prev => ({ ...prev, [data.callSid]: data }));
      // Auto-select if it's the only call
      setSelectedCall(current => !current ? data.callSid : current);
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

  const takeOverCall = async (callSid: string) => {
    try {
      await fetch('/api/take-over-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callSid }),
      });
      
      // Remove call from active calls
      setActiveCalls(prev => {
        const newCalls = { ...prev };
        delete newCalls[callSid];
        return newCalls;
      });
      
      if (selectedCall === callSid) {
        setSelectedCall(null);
      }
    } catch (error) {
      alert('Failed to take over call. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Call Assistant</h1>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calls List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium text-gray-900">Active Calls</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {Object.keys(activeCalls).length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">No active calls</p>
                ) : (
                  Object.entries(activeCalls).map(([callSid, call]) => (
                    <button
                      key={callSid}
                      onClick={() => setSelectedCall(callSid)}
                      className={`w-full text-left p-4 hover:bg-gray-50 focus:outline-none ${selectedCall === callSid ? 'bg-blue-50' : ''}`}
                    >
                      <p className="font-medium text-gray-900">{call.callerNumber}</p>
                      <p className="text-sm text-gray-500 truncate">{call.transcript?.length || 0} messages</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Conversation View */}
          <div className="lg:col-span-2">
            {selectedCall && activeCalls[selectedCall] ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      Call from {activeCalls[selectedCall].callerNumber}
                    </h2>
                    <p className="text-sm text-gray-500">Call ID: {selectedCall}</p>
                  </div>
                  <button
                    onClick={() => takeOverCall(selectedCall)}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Take Over Call
                  </button>
                </div>
                <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                  {activeCalls[selectedCall].transcript?.map((line, i) => (
                    <div 
                      key={i} 
                      className={`flex ${line.speaker === 'AI' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-lg ${line.speaker === 'AI' 
                          ? 'bg-blue-100 text-blue-900' 
                          : 'bg-gray-100 text-gray-900'}`}
                      >
                        <p className="text-sm font-medium mb-1">{line.speaker}</p>
                        <p>{line.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">Select a call to view the conversation</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
