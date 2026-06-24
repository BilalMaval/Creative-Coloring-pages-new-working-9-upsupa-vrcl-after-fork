'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export default function PhotoGallery({ images = [], mainImage, title }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef(null);
  
  // Combine main image with gallery images
  const allImages = mainImage ? [mainImage, ...images] : images;
  
  if (allImages.length === 0) return null;
  
  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  };
  
  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };
  
  const selectImage = (index) => {
    setCurrentIndex(index);
  };

  const handleMouseMove = (e) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };
  
  return (
    <div className="space-y-4">
      {/* Main Image Display with Navigation Arrows */}
      <div className="relative">
        <div 
          ref={imageContainerRef}
          className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl relative overflow-hidden cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="w-full h-full relative transition-transform duration-100 ease-out"
            style={isHovering ? {
              transform: 'scale(2.5)',
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
            } : {
              transform: 'scale(1)',
              transformOrigin: 'center center'
            }}
          >
            <Image
              src={allImages[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              fill
              className="object-contain p-4"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          
          {/* Zoom indicator - only show when not hovering */}
          {!isHovering && (
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 pointer-events-none">
              <ZoomIn className="h-4 w-4" />
              Hover to zoom
            </div>
          )}
        </div>
        
        {/* Navigation Arrows - Only show if multiple images */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6 text-gray-800" />
            </button>
            
            {/* Image counter */}
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
              {currentIndex + 1} / {allImages.length}
            </div>
          </>
        )}
      </div>
      
      {/* Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div>
          <p className="text-sm font-bold text-gray-700 mb-2">📷 Gallery ({allImages.length} images)</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allImages.map((img, index) => (
              <button
                key={index}
                onClick={() => selectImage(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-3 transition-all hover:scale-105 ${
                  index === currentIndex 
                    ? 'border-blue-500 ring-2 ring-blue-300' 
                    : 'border-gray-200 hover:border-blue-400'
                }`}
              >
                <Image
                  src={img}
                  alt={`${title} - Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
