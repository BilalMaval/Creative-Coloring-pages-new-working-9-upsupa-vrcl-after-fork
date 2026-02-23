'use client';

import Link from 'next/link';
import { Download, Eye } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-5rem)] bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 mb-8">
          <Link href="/" className="text-gray-500 hover:text-purple-600 font-bold text-sm">Home</Link>
          <span className="text-gray-400">›</span>
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          <span className="text-gray-400">›</span>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <span className="text-gray-400">›</span>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Section */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
              <div className="text-6xl opacity-30">🎨</div>
            </div>
            
            {/* Stats - Same layout as actual */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center bg-blue-50 rounded-xl p-3">
                <Download className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <div className="h-8 w-16 bg-blue-200 rounded mx-auto mb-1 animate-pulse"></div>
                <p className="text-xs text-gray-600 font-bold">Downloads</p>
              </div>
              <div className="text-center bg-purple-50 rounded-xl p-3">
                <Eye className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <div className="h-8 w-16 bg-purple-200 rounded mx-auto mb-1 animate-pulse"></div>
                <p className="text-xs text-gray-600 font-bold">Views</p>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/50 to-transparent -translate-x-full animate-shimmer"></div>
              
              {/* Title */}
              <div className="h-10 bg-gray-200 rounded-xl w-3/4 mb-4 animate-pulse"></div>
              
              {/* Category badge */}
              <div className="h-8 bg-blue-100 rounded-full w-36 mb-4 animate-pulse"></div>
              
              {/* Date */}
              <div className="h-4 bg-gray-100 rounded w-48 mb-6 animate-pulse"></div>
              
              {/* Price box */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 mb-4">
                <p className="text-3xl md:text-4xl font-black text-white text-center">100% FREE!</p>
                <p className="text-white text-center font-bold">Download and print unlimited times</p>
              </div>
              
              {/* Download button */}
              <div className="h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl animate-pulse"></div>
              
              {/* Action buttons */}
              <div className="flex gap-4 mt-4">
                <div className="h-12 bg-gray-100 rounded-xl flex-1 animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded-xl flex-1 animate-pulse"></div>
              </div>
            </div>

            {/* What you get section */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <h3 className="text-xl font-black text-gray-800 mb-4">What You Get:</h3>
              <div className="space-y-3">
                {['High-quality printable PDF', 'Print unlimited times', 'Instant download', 'Perfect for home or school'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
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
