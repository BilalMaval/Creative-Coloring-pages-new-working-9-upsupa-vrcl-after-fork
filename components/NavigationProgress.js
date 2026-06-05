'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';

function NavigationProgressInner() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  // Hide overlay when pathname changes (new page loaded)
  useEffect(() => {
    if (currentPath && currentPath !== pathname) {
      // Small delay to ensure smooth transition
      setTimeout(() => setIsNavigating(false), 50);
    }
    setCurrentPath(pathname);
  }, [pathname, currentPath]);

  // Listen for link clicks to show overlay immediately
  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      
      // Check if it's an internal link
      const href = link.getAttribute('href');
      if (!href) return;
      
      // Skip external links, hash links, and same-page links
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
      
      // Skip if it's the same path
      if (href === pathname) return;
      
      // Show loading overlay
      setIsNavigating(true);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div 
      className="fixed z-50 bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center"
      style={{ 
        top: '80px', 
        left: 0, 
        right: 0, 
        bottom: 0 
      }}
    >
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

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
