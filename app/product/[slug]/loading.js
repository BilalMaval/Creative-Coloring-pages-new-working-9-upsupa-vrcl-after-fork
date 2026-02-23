export default function Loading() {
  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex-1">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs skeleton */}
        <div className="flex items-center space-x-2 mb-8">
          <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
          <span className="text-gray-300">›</span>
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          <span className="text-gray-300">›</span>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <span className="text-gray-300">›</span>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Section skeleton */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl animate-pulse flex items-center justify-center">
              <div className="text-6xl opacity-30">🎨</div>
            </div>
            {/* Thumbnail row */}
            <div className="flex gap-2 mt-4 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
              ))}
            </div>
          </div>

          {/* Details Section skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              {/* Title */}
              <div className="h-10 bg-gray-200 rounded-xl w-3/4 mb-4 animate-pulse"></div>
              
              {/* Category badge */}
              <div className="h-8 bg-blue-100 rounded-full w-36 mb-4 animate-pulse"></div>
              
              {/* Date */}
              <div className="h-4 bg-gray-100 rounded w-48 mb-6 animate-pulse"></div>
              
              {/* Price box */}
              <div className="h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-4 animate-pulse"></div>
              
              {/* Download button */}
              <div className="h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl mb-4 animate-pulse"></div>
              
              {/* Action buttons */}
              <div className="flex gap-4">
                <div className="h-12 bg-gray-100 rounded-xl flex-1 animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded-xl flex-1 animate-pulse"></div>
              </div>
            </div>

            {/* What you get section */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-5 w-5 bg-green-200 rounded-full animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-40 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
