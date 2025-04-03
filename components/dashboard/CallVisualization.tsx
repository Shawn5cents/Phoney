import { useCallUpdates } from '@/hooks/useCallUpdates';

interface CallVisualizationProps {
  callId?: string;
}

export function CallVisualization({ callId }: CallVisualizationProps) {
  const { activeCall } = useCallUpdates(callId);
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative mb-6">
        {/* Phone icon with gradient background */}
        <div className={`w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ${activeCall ? 'scale-110 transition-transform duration-300' : 'opacity-80'}`}>
          <svg
            className="w-16 h-16 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>
        
        {/* Animated rings for active call */}
        {activeCall && (
          <>
            <div className="absolute top-0 left-0 right-0 bottom-0 w-32 h-32 rounded-full animate-ping opacity-30 bg-gradient-to-br from-blue-400 to-purple-500"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 w-32 h-32 rounded-full animate-pulse opacity-40 bg-gradient-to-br from-blue-400 to-purple-500 blur-sm"></div>
            <div className="absolute -top-2 -left-2 -right-2 -bottom-2 w-36 h-36 rounded-full animate-pulse opacity-20 bg-gradient-to-br from-blue-300 to-purple-400 blur-md"></div>
          </>
        )}
      </div>
      
      {/* Call status indicator */}
      <div className="text-center">
        <span className={`inline-flex items-center px-4 py-2 rounded-full ${activeCall ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          <span className={`w-3 h-3 mr-2 rounded-full ${activeCall ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
          {activeCall ? 'Call Active' : 'Waiting for Call'}
        </span>
      </div>
    </div>
  );
}
