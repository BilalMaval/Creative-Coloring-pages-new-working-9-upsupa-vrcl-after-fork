'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header banner - Same as actual page */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 md:p-12 shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
          <div className="text-center space-y-4">
            <div className="h-12 md:h-16 bg-white/30 rounded-xl w-48 md:w-64 mx-auto animate-pulse"></div>
            <div className="h-5 md:h-6 bg-white/30 rounded-xl w-64 md:w-96 mx-auto animate-pulse"></div>
            <div className="h-10 bg-white/50 rounded-full w-32 md:w-40 mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Breadcrumbs - Same structure */}
        <div className="flex items-center space-x-2 mb-6">
          <Link href="/" className="text-gray-500 hover:text-purple-600 font-bold text-sm">Home</Link>
          <span className="text-gray-400">›</span>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <span className="text-gray-400">›</span>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Section title */}
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-7 w-7 text-yellow-500" />
          <h2 className="text-2xl md:text-3xl font-black text-gray-800">Available Products</h2>
        </div>
        <p className="text-gray-600 mb-6">Click any product to view details and download</p>

        {/* Products grid - Skeleton matching actual layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="group bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300">
              <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  FREE
                </div>
              </div>
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3 mx-auto animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
