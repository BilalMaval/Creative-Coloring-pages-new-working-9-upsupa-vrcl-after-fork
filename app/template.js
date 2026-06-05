'use client';

import { usePathname } from 'next/navigation';

// Template component ensures page content re-renders on navigation
// This prevents the previous page from "flashing" during transitions
export default function Template({ children }) {
  const pathname = usePathname();
  
  return (
    <div key={pathname} className="flex-1 flex flex-col">
      {children}
    </div>
  );
}
