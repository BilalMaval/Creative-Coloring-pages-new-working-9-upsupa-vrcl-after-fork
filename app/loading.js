'use client';

import Image from 'next/image';
import SearchBar from '@/components/SearchBar';
import { Star, Download, Palette } from 'lucide-react';

// This loading component matches the exact layout of the homepage
export default function Loading() {
  return (
    <div className="flex-1 bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section - Same structure as actual page */}
      <section className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-6 mb-8">
            {/* Logo - Same dimensions as actual */}
            <div className="relative w-48 h-48 md:w-64 md:h-64">
              <Image
                src="https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png"
                alt="Creative Coloring Pages Logo"
                fill
                className="object-contain drop-shadow-2xl"
                priority
                sizes="(max-width: 768px) 192px, 256px"
              />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl md:text-6xl font-black text-gray-800">
                Creative Coloring Pages
              </h1>
              <div className="inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold text-xl md:text-3xl py-3 px-8 rounded-full shadow-xl">
                <Palette className="inline-block mr-2 h-8 w-8" />
                100% FREE Coloring Pages!
              </div>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Perfect for kids and families! Download, print, and color amazing pages!
          </p>
          <div className="flex justify-center pt-4">
            <div className="w-full max-w-2xl">
              <SearchBar />
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <div className="bg-white border-4 border-blue-400 text-blue-600 font-bold py-4 px-6 rounded-2xl shadow-lg">
              <Star className="inline-block mr-2 h-5 w-5" />
              48+ Collections
            </div>
            <div className="bg-white border-4 border-pink-400 text-pink-600 font-bold py-4 px-6 rounded-2xl shadow-lg">
              <Palette className="inline-block mr-2 h-5 w-5" />
              New Pages Daily
            </div>
            <div className="bg-white border-4 border-green-400 text-green-600 font-bold py-4 px-6 rounded-2xl shadow-lg">
              <Download className="inline-block mr-2 h-5 w-5" />
              Easy to Print!
            </div>
          </div>
        </div>
      </section>

      {/* Collections Section - Skeleton matching actual layout */}
      <section className="container mx-auto px-4 mb-16">
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-3xl p-8 shadow-2xl mb-8">
          <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-2">
            🎨 Choose Your Collection! 🌈
          </h2>
          <p className="text-center text-white font-bold text-lg md:text-xl">
            Click on any collection to explore amazing content!
          </p>
        </div>
        
        {/* Collection cards - Animated skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {[
            { color: 'from-blue-500 to-purple-600', emoji: '🎨', name: 'Coloring Pages' },
            { color: 'from-green-500 to-teal-600', emoji: '📅', name: 'Calendars' },
            { color: 'from-pink-500 to-orange-500', emoji: '📄', name: 'Printables' },
            { color: 'from-indigo-500 to-purple-600', emoji: '📚', name: 'Book Shop' }
          ].map((item, i) => (
            <div 
              key={i} 
              className={`bg-gradient-to-br ${item.color} rounded-3xl p-8 shadow-2xl border-4 border-white relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
              <div className="text-center space-y-4">
                <div className="text-8xl mb-4">{item.emoji}</div>
                <h3 className="text-3xl md:text-4xl font-black text-white">{item.name}</h3>
                <div className="h-6 bg-white/30 rounded-xl w-48 mx-auto animate-pulse"></div>
                <div className="bg-white text-gray-800 font-black py-3 px-6 rounded-full inline-block opacity-75">
                  Loading...
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
