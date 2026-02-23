'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section Skeleton */}
      <section className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-6 mb-8">
            {/* Logo placeholder with spinner */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-purple-500" />
            </div>
            <div className="space-y-3">
              <div className="h-12 md:h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl w-80 md:w-96 mx-auto animate-shimmer"></div>
              <div className="h-14 bg-gradient-to-r from-purple-300 via-purple-200 to-purple-300 rounded-full w-72 md:w-80 mx-auto animate-shimmer"></div>
            </div>
          </div>
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl w-96 mx-auto animate-shimmer"></div>
          
          {/* Search bar skeleton */}
          <div className="flex justify-center pt-4">
            <div className="w-full max-w-2xl h-12 bg-white rounded-xl shadow-lg animate-pulse"></div>
          </div>
          
          {/* Stats badges skeleton */}
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 w-40 bg-white rounded-2xl shadow-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections Section Skeleton */}
      <section className="container mx-auto px-4 mb-16">
        <div className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 rounded-3xl p-8 shadow-2xl mb-8 animate-pulse">
          <div className="h-12 bg-white/30 rounded-xl w-80 mx-auto mb-2"></div>
          <div className="h-6 bg-white/30 rounded-xl w-96 mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl p-8 shadow-2xl animate-pulse">
              <div className="text-center space-y-4">
                <div className="h-24 w-24 bg-white/30 rounded-full mx-auto"></div>
                <div className="h-10 bg-white/30 rounded-xl w-40 mx-auto"></div>
                <div className="h-6 bg-white/30 rounded-xl w-48 mx-auto"></div>
                <div className="h-10 bg-white/50 rounded-full w-36 mx-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
