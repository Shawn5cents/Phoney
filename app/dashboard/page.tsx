'use client';

import {
  CallVisualization,
  TranscriptionPanel,
  DashboardHeader,
  CallControls,
  PersonalitySelector
} from '@/components';

import { useState, useCallback, useEffect } from 'react';
import { pusherClient } from '@/lib/pusher';

export default function DashboardPage() {
  const [activeCallId, setActiveCallId] = useState<string>();

  // Listen for new calls
  useEffect(() => {
    // Subscribe to main calls channel
    const mainChannel = pusherClient.subscribe('calls');

    mainChannel.bind('call.started', (data: { callId: string, caller: string }) => {
      console.log('New call received:', data);
      setActiveCallId(data.callId);
    });

    // If there's an active call, subscribe to its specific channel
    if (activeCallId) {
      const callChannel = pusherClient.subscribe(`call-${activeCallId}`);

      callChannel.bind('call.ended', () => {
        console.log('Call ended:', activeCallId);
        setActiveCallId(undefined);
      });

      return () => {
        pusherClient.unsubscribe(`call-${activeCallId}`);
        pusherClient.unsubscribe('calls');
      };
    }

    return () => {
      pusherClient.unsubscribe('calls');
    };
  }, [activeCallId]);
  const [currentPersonality, setCurrentPersonality] = useState('professional');

  const handlePersonalityChange = useCallback(async (personalityId: string) => {
    setCurrentPersonality(personalityId);
    try {
      await fetch('/api/set-personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalityId })
      });
    } catch (error) {
      console.error('Failed to update personality:', error);
    }
  }, []);
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <DashboardHeader />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* AI Personality Selection */}
        <PersonalitySelector
          onSelect={handlePersonalityChange}
          currentPersonality={currentPersonality}
        />
        
        {/* Dashboard Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel - Call Visualization and Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Active Call</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  Live Status
                </span>
              </div>
              <CallVisualization callId={activeCallId} />
              <CallControls callId={activeCallId} />
            </div>
          </div>
          
          {/* Right panel - Transcription */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Live Transcription</h2>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0 2a10 10 0 100-20 10 10 0 000 20z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600">Real-time updates</span>
                </div>
              </div>
              <TranscriptionPanel callId={activeCallId} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
