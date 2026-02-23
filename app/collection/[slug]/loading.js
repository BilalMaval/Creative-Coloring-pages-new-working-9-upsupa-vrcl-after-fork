export default function Loading() {
  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex-1">
      <div className="container mx-auto px-4 py-8">
        {/* Header banner skeleton */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 md:p-12 shadow-2xl mb-8">
          <div className="text-center space-y-4">
            <div className="text-6xl md:text-8xl mb-4 opacity-50">🎨</div>
            <div className="h-12 md:h-16 bg-white/30 rounded-xl w-48 md:w-64 mx-auto animate-pulse"></div>
            <div className="h-5 md:h-6 bg-white/30 rounded-xl w-64 md:w-80 mx-auto animate-pulse"></div>
            <div className="h-10 bg-white/50 rounded-full w-40 md:w-48 mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Breadcrumbs skeleton */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
          <span className="text-gray-300">›</span>
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Section title skeleton */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 bg-yellow-200 rounded animate-pulse"></div>
          <div className="h-7 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-6"></div>

        {/* Categories grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-lg border-4 border-transparent">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 flex items-center justify-center animate-pulse">
                <div className="text-4xl opacity-30">📁</div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
