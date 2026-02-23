'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-5rem)] bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Header banner - Same as actual page */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 md:p-12 shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>
          <div className="text-center space-y-4">
            <div className="text-6xl md:text-8xl mb-4 animate-bounce">🎨</div>
            <div className="h-12 md:h-16 bg-white/30 rounded-xl w-48 md:w-64 mx-auto animate-pulse"></div>
            <div className="h-5 md:h-6 bg-white/30 rounded-xl w-64 md:w-80 mx-auto animate-pulse"></div>
            <div className="h-10 bg-white/50 rounded-full w-40 md:w-48 mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 mb-6">
          <Link href="/" className="text-gray-500 hover:text-purple-600 font-bold text-sm">Home</Link>
          <span className="text-gray-400">›</span>
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Section title */}
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-7 w-7 text-yellow-500" />
          <h2 className="text-2xl md:text-3xl font-black text-gray-800">Browse Categories</h2>
        </div>
        <p className="text-gray-600 mb-6">Click any category to see products</p>

        {/* Categories grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-lg border-4 border-transparent hover:border-purple-300 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer"></div>
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 flex items-center justify-center">
                  <div className="text-4xl opacity-50">📁</div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
