import { Suspense } from 'react';
import SearchPageClient from './SearchPageClient';

export const metadata = {
  title: 'Search Coloring Pages & Printables',
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SearchPageClient />
    </Suspense>
  );
}
