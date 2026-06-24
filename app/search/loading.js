'use client';

// Search loading state - fills viewport to hide footer during load
export default function Loading() {
  return (
    <div className="flex-1 bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-[calc(100vh-80px)]">
      <div className="container mx-auto px-4 py-8">
        {/* Search header skeleton */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="text-center space-y-4">
            <div className="h-10 bg-white/30 rounded-xl w-48 mx-auto animate-pulse"></div>
            <div className="h-12 bg-white/50 rounded-full w-full max-w-xl mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Results skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 shadow-lg">
              <div className="aspect-[3/4] bg-gray-200 rounded-xl mb-3 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
