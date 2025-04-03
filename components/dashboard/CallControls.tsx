import { useCallUpdates } from '@/hooks/useCallUpdates';

interface CallControlsProps {
  callId?: string;
}

export function CallControls({ callId }: CallControlsProps) {
  const { activeCall, takeOverCall, endCall } = useCallUpdates(callId);

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
          className="py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 transform hover:scale-105"
          onClick={takeOverCall}
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
      
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center text-blue-700">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Take over to speak directly with the caller or end the call to disconnect.</p>
        </div>
      </div>
    </div>
  );
}
