'use client';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-5rem)] bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Search header skeleton */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl p-8 md:p-12 shadow-2xl mb-8">
          <div className="text-center space-y-4">
            <div className="h-12 bg-white/30 rounded-xl w-64 mx-auto animate-pulse"></div>
            <div className="h-12 bg-white/50 rounded-xl w-full max-w-2xl mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Results skeleton */}
        <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
        
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg relative">
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer"></div>
                </div>
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-2/3 mx-auto animate-pulse"></div>
                </div>
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
