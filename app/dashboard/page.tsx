import {
  CallVisualization,
  TranscriptionPanel,
  DashboardHeader,
  CallControls,
  PersonalitySelector
} from '@/components';

'use client';

import { useState, useCallback } from 'react';

export default function DashboardPage() {
  const [activeCallId, setActiveCallId] = useState<string>();
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
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="container mx-auto px-4 py-8">
        <PersonalitySelector
          onSelect={handlePersonalityChange}
          currentPersonality={currentPersonality}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel - Call Visualization */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Active Call</h2>
              <CallVisualization callId={activeCallId} />
              <CallControls callId={activeCallId} />
            </div>
          </div>
          
          {/* Right panel - Transcription */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Live Transcription</h2>
              <TranscriptionPanel callId={activeCallId} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
