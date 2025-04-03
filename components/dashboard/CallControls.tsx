import { useCallUpdates } from '@/hooks/useCallUpdates';

interface CallControlsProps {
  callId?: string;
}

export function CallControls({ callId }: CallControlsProps) {
  const { activeCall, takeOverCall, endCall } = useCallUpdates(callId);

  if (!activeCall) return null;

  return (
    <div className="mt-6 space-y-4">
      <button
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors"
        onClick={takeOverCall}
      >
        Take Over Call
      </button>
      
      <button
        className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow transition-colors"
        onClick={endCall}
      >
        End Call
      </button>
    </div>
  );
}
