export default function Loading() {
  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl p-8 md:p-12 shadow-2xl mb-8">
          <div className="text-center space-y-4">
            <div className="h-20 w-20 bg-white/30 rounded-full mx-auto animate-pulse"></div>
            <div className="h-12 bg-white/30 rounded-xl w-64 mx-auto animate-pulse"></div>
            <div className="h-6 bg-white/30 rounded-xl w-80 mx-auto animate-pulse"></div>
            <div className="h-10 bg-white/50 rounded-full w-48 mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Breadcrumbs skeleton */}
        <div className="flex items-center space-x-2 mb-8">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
          <span className="text-gray-400">›</span>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Section title */}
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse"></div>
        </div>

        {/* Categories grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-100">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
