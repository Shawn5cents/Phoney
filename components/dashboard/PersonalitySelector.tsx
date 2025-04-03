import { personalities } from '@/lib/ai-personalities';
import { useState } from 'react';

interface PersonalitySelectorProps {
  onSelect: (personalityId: string) => void;
  currentPersonality?: string;
}

export function PersonalitySelector({ onSelect, currentPersonality }: PersonalitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">AI Personality</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(personalities).map(([id, personality]) => (
          <div
            key={id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all
              ${currentPersonality === id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            onClick={() => {
              onSelect(id);
              setIsOpen(false);
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{personality.name}</h3>
              {currentPersonality === id && (
                <span className="text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-2">{personality.description}</p>
            <div className="flex flex-wrap gap-2">
              {personality.traits.map((trait) => (
                <span
                  key={trait}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
