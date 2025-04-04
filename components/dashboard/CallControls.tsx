import { useState, useRef } from 'react';
import { useCallUpdates } from '@/hooks/useCallUpdates';
import { CallInterface } from './CallInterface';

interface CallControlsProps {
  callId?: string;
}

export function CallControls({ callId }: CallControlsProps) {
  const { activeCall, takeOverCall, endCall } = useCallUpdates(callId);
  const [showInterface, setShowInterface] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const transferNumberRef = useRef<HTMLInputElement>(null);
  console.log('CallControls - Current callId:', callId);

  const handleTakeOver = async () => {
    await takeOverCall();
    setShowInterface(true);
  };

  const handleTransfer = async () => {
    if (!callId || !transferNumberRef.current?.value) return;
    
    setIsTransferring(true);
    try {
      const response = await fetch('/api/transfer-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callSid: callId,
          transferNumber: transferNumberRef.current.value
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to transfer call');
      }
      
      setTransferSuccess(true);
      setTimeout(() => {
        setIsTransferring(false);
        setTransferSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error transferring call:', error);
      setIsTransferring(false);
    }
  };

  if (!activeCall) {
    return (
      <div className="mt-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
        <div className="text-center text-gray-500">
          <p>No active call</p>
          <p className="text-sm mt-2">Controls will appear here when a call is active</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Call Controls</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          className="py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 transform hover:scale-105"
          onClick={handleTakeOver}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Take Over</span>
        </button>
        
        <button
          className="py-3 px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 transform hover:scale-105"
          onClick={endCall}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>End Call</span>
        </button>
      </div>
      
      {/* Call Transfer Section */}
      <div className="mt-4 p-4 border border-blue-200 rounded-xl bg-blue-50">
        <h4 className="text-md font-medium text-blue-700 mb-2">Transfer Call</h4>
        <div className="flex items-stretch gap-2">
          <div className="flex-grow">
            <input
              ref={transferNumberRef}
              type="tel"
              placeholder="Enter phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isTransferring}
            />
          </div>
          <button
            onClick={handleTransfer}
            disabled={isTransferring}
            className={`px-4 py-2 rounded-lg text-white font-medium ${isTransferring ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'} transition-colors flex items-center justify-center`}
          >
            {isTransferring ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span>Transfer</span>
              </>
            )}
          </button>
        </div>
        {transferSuccess && (
          <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg border border-green-200">
            Call successfully transferred!
          </div>
        )}
        <p className="text-xs text-blue-600 mt-2">Enter a number to transfer the call to your phone.</p>
      </div>
      
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center text-blue-700">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Take over to speak directly with the caller or end the call to disconnect.</p>
        </div>
      </div>

      {showInterface && (
        <CallInterface
          callId={callId}
          onClose={() => {
            setShowInterface(false);
            endCall();
          }}
        />
      )}
    </div>
  );
}
