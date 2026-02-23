'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
        <p className="text-xl font-bold text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
