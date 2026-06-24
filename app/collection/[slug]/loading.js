'use client';

// Collection loading state - fills viewport to hide footer during load
export default function Loading() {
  return (
    <div className="flex-1 bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-[calc(100vh-80px)]">
      <div className="container mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 md:p-12 shadow-2xl mb-8">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">🎨</div>
            <div className="h-12 bg-white/30 rounded-xl w-64 mx-auto animate-pulse"></div>
            <div className="h-6 bg-white/20 rounded-xl w-48 mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-lg border-4 border-gray-200">
              <div className="aspect-square bg-gray-200 rounded-xl mb-3 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
