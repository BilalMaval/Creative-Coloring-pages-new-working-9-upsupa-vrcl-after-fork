'use client';

export default function Loading() {
  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs skeleton */}
        <div className="flex items-center space-x-2 mb-8">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
          <span className="text-gray-400">›</span>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <span className="text-gray-400">›</span>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Section skeleton */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <div className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
              <div className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* Details Section skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <div className="h-12 bg-gray-200 rounded-xl w-3/4 mb-4 animate-pulse"></div>
              <div className="h-8 bg-blue-100 rounded-full w-32 mb-4 animate-pulse"></div>
              <div className="space-y-2 mb-6">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
              </div>
              <div className="h-24 bg-purple-200 rounded-2xl mb-4 animate-pulse"></div>
              <div className="h-16 bg-purple-300 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
