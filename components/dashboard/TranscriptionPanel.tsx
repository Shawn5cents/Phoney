import { useCallUpdates } from '@/hooks/useCallUpdates';

interface TranscriptionPanelProps {
  callId?: string;
}

export function TranscriptionPanel({ callId }: TranscriptionPanelProps) {
  const { transcripts } = useCallUpdates(callId);

  return (
    <div className="bg-gray-50 rounded-lg p-4 h-[500px] overflow-y-auto">
      {transcripts.map((message) => (
        <div
          key={message.id}
          className={`mb-4 ${
            message.sender === 'ai' ? 'pl-4' : 'pl-8'
          }`}
        >
          <div className="flex items-start">
            <div
              className={`p-3 rounded-lg ${
                message.sender === 'ai'
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-green-100 text-green-900'
              }`}
            >
              <p className="text-sm font-mono">{message.text}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
