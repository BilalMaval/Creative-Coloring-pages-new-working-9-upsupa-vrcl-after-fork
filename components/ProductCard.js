'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';

function StarRating({ rating, size = 'sm' }) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

export default function ProductCard({ product, showRating = true, priority = false }) {
  const averageRating = product.averageRating || 0;
  const reviewCount = product.reviewCount || 0;
  
  return (
    <Link href={`/product/${product.slug}`}>
      <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-gray-200 hover:border-blue-400">
        <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 relative overflow-hidden">
          {product.webpPath ? (
            <Image
              src={product.webpPath}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 20vw, 16vw"
              priority={priority}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-4xl">🎨</span>
            </div>
          )}
          {product.isFree === false && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full">
              ${Number(product.price).toFixed(2)}
            </div>
          )}
        </div>
        <h3 className="font-black text-center text-gray-800 text-xs md:text-sm line-clamp-2 mb-1">
          {product.title}
        </h3>
        {showRating && (
          <div className="flex items-center justify-center gap-1">
            <StarRating rating={averageRating} size="xs" />
            {reviewCount > 0 && (
              <span className="text-xs text-gray-500">({reviewCount})</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export { StarRating };
