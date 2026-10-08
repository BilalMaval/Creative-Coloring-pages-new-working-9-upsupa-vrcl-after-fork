'use client';

import Image from 'next/image';
import { useBrand } from '@/components/BrandProvider';

export default function HeroLogo() {
  const brand = useBrand();
  
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64">
      <Image
        src={brand.logoSmall || brand.logo}
        alt={`${brand.name} Logo`}
        fill
        className="object-contain drop-shadow-2xl"
        priority
        sizes="(max-width: 768px) 192px, 256px"
        loading="eager"
      />
    </div>
  );
}
