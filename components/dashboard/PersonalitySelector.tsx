import { personalities } from '@/lib/ai-personalities';
import { useState } from 'react';

interface PersonalitySelectorProps {
  onSelect: (personalityId: string) => void;
  currentPersonality?: string;
}

export function PersonalitySelector({ onSelect, currentPersonality = 'professional' }: PersonalitySelectorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">AI Personality</h2>
        <div className="ml-4 flex items-center rounded-full bg-blue-50 px-3 py-1 border border-blue-100">
          <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
          <span className="text-sm text-blue-700 font-medium">Affects live calls</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(personalities).map(([id, personality]) => {
          const isActive = currentPersonality === id;
          return (
            <div
              key={id}
              className={`relative overflow-hidden rounded-xl transition-all duration-300 
                ${isActive ? 'ring-2 ring-offset-2 ring-blue-500 transform scale-[1.02]' : 'ring-1 ring-gray-200'} 
                shadow-sm hover:shadow-md cursor-pointer`}
              onClick={() => onSelect(id)}
            >
              {/* Personality icon based on id */}
              <div className={`h-16 flex items-center justify-center
                ${id === 'professional' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                  id === 'friendly' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                  id === 'witty' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                  'bg-gradient-to-r from-purple-400 to-indigo-500'}`}
              >
                {id === 'professional' && (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {id === 'friendly' && (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {id === 'witty' && (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
                {id === 'zen' && (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800">{personality.name}</h3>
                  {isActive && (
                    <span className="text-blue-500 bg-blue-50 p-1 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{personality.description}</p>
                
                <div className="flex flex-wrap gap-1">
                  {personality.traits.map((trait) => (
                    <span
                      key={trait}
                      className={`px-2 py-0.5 text-xs rounded-full
                        ${id === 'professional' ? 'bg-blue-50 text-blue-700' :
                          id === 'friendly' ? 'bg-green-50 text-green-700' :
                          id === 'witty' ? 'bg-amber-50 text-amber-700' :
                          'bg-purple-50 text-purple-700'}`}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
