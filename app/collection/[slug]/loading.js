'use client';

export default function Loading() {
  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl p-8 md:p-12 shadow-2xl mb-8 animate-pulse">
          <div className="text-center space-y-4">
            <div className="h-20 w-20 bg-white/30 rounded-full mx-auto"></div>
            <div className="h-16 bg-white/30 rounded-xl w-64 mx-auto"></div>
            <div className="h-8 bg-white/30 rounded-xl w-96 mx-auto"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-lg animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-xl mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
