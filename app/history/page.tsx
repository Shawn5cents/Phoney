'use client';

import { DashboardHeader } from '@/components';
import { useState, useEffect } from 'react';

export default function HistoryPage() {
  const [calls, setCalls] = useState([]);

  return (
    <div>
      <DashboardHeader />
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Call History</h1>
          <p className="mt-2 text-gray-600">View past calls and their transcripts</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center text-gray-500 py-8">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">Call History Coming Soon</h3>
            <p className="text-sm">This feature is under development.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
