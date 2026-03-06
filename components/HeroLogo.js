'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function HeroLogo() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showImage, setShowImage] = useState(false);

  // Small delay before showing image to ensure smooth transition
  useEffect(() => {
    const timer = setTimeout(() => setShowImage(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64">
      {/* Animated placeholder while loading */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
          isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="w-36 h-36 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center shadow-lg">
          <div className="animate-bounce">
            <span className="text-6xl md:text-7xl">🎨</span>
          </div>
        </div>
      </div>
      
      {/* Actual Logo with smooth fade-in */}
      {showImage && (
        <Image
          src="https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png"
          alt="Creative Coloring Pages Logo"
          fill
          className={`object-contain drop-shadow-2xl transition-all duration-700 ease-out ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
          priority
          sizes="(max-width: 768px) 192px, 256px"
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
}
