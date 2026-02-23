export default function Loading() {
  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header banner skeleton - same size as real page */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 md:p-12 shadow-2xl mb-8">
          <div className="text-center space-y-4">
            <div className="h-12 md:h-16 bg-white/30 rounded-xl w-48 md:w-64 mx-auto animate-pulse"></div>
            <div className="h-5 md:h-6 bg-white/30 rounded-xl w-64 md:w-96 mx-auto animate-pulse"></div>
            <div className="h-10 bg-white/50 rounded-full w-32 md:w-40 mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Breadcrumbs skeleton */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
          <span className="text-gray-300">›</span>
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          <span className="text-gray-300">›</span>
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Section title skeleton */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 bg-yellow-200 rounded animate-pulse"></div>
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-56 bg-gray-100 rounded animate-pulse mb-6"></div>

        {/* Products grid skeleton - 6 columns on large screens */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100">
              {/* Image placeholder */}
              <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 relative animate-pulse">
                <div className="absolute top-2 left-2 h-5 w-12 bg-green-200 rounded-full"></div>
              </div>
              {/* Content placeholder */}
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3 mx-auto animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
