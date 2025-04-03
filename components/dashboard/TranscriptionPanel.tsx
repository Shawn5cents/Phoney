import { useCallUpdates } from '@/hooks/useCallUpdates';

interface TranscriptionPanelProps {
  callId?: string;
}

export function TranscriptionPanel({ callId }: TranscriptionPanelProps) {
  const { transcripts } = useCallUpdates(callId);

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-6 h-[500px] overflow-y-auto shadow-inner">
      {transcripts.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-500">No conversation yet</h3>
          <p className="text-gray-400 max-w-xs mt-2">When a call is active, the transcript will appear here in real-time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transcripts.map((message) => (
            <div key={message.id} className="flex items-start gap-3">
              {/* Avatar/icon for the message sender */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.sender === 'ai' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-green-400 to-emerald-500'}`}>
                {message.sender === 'ai' ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              
              {/* Message content */}
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="font-semibold text-sm text-gray-700">
                    {message.sender === 'ai' ? 'AI Assistant' : 'Caller'}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className={`p-3 rounded-lg shadow-sm ${message.sender === 'ai' ? 'bg-white border border-blue-100' : 'bg-green-50 border border-green-100'}`}>
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
