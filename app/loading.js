'use client';

// Root loading - shows a full-height background to prevent footer flash
export default function Loading() {
  return (
    <div className="flex-1 min-h-[calc(100vh-80px)] bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
        </div>
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  );
}
