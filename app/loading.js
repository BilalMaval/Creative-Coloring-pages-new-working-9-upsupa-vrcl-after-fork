'use client';

import { Suspense } from 'react';

// This loading state immediately replaces page content during navigation
// It prevents the previous page from "flashing" during transitions
export default function Loading() {
  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center" style={{ top: '80px' }}>
      <div className="text-center space-y-4">
        {/* Simple spinner */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
        </div>
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  );
}
