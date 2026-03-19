'use client';

import { useBrand } from '@/components/BrandProvider';

export default function BrandTitle() {
  const brand = useBrand();
  
  return (
    <h1 className="text-4xl md:text-6xl font-black text-gray-800">
      {brand.name}
    </h1>
  );
}
