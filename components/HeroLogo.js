'use client';

import Image from 'next/image';

export default function HeroLogo() {
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64">
      <Image
        src="https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png"
        alt="Creative Coloring Pages Logo"
        fill
        className="object-contain drop-shadow-2xl"
        priority
        sizes="(max-width: 768px) 192px, 256px"
        loading="eager"
      />
    </div>
  );
}
