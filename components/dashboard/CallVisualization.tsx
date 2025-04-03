import { useCallUpdates } from '@/hooks/useCallUpdates';

interface CallVisualizationProps {
  callId?: string;
}

export function CallVisualization({ callId }: CallVisualizationProps) {
  const { activeCall } = useCallUpdates(callId);
  
  const pulseClass = activeCall ? 'animate-pulse' : '';
  
  return (
    <div className="flex justify-center items-center p-8">
      <div className={`relative ${pulseClass}`}>
        <div className="w-24 h-24 bg-[#4A90E2] rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-white"
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
        {activeCall && (
          <>
            <div className="absolute inset-0 w-24 h-24 bg-[#4A90E2] rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-0 w-24 h-24 bg-[#4A90E2] rounded-full animate-pulse opacity-75"></div>
          </>
        )}
      </div>
    </div>
  );
}
