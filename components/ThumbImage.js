'use client';

import { useState } from 'react';
import Image from 'next/image';
import { variantUrl } from '@/lib/images';

// Renders a resized WebP variant of a CDN image ('thumb' | 'medium' | 'tiny', or 'original');
// falls back to the original if the variant is missing.
export default function ThumbImage({ src, variant = 'thumb', onError, ...props }) {
  const mapped = variantUrl(src, variant);
  const [failedFor, setFailedFor] = useState(null);
  const current = failedFor === src ? src : mapped;

  return (
    <Image
      {...props}
      src={current}
      onError={(e) => {
        if (current !== src) setFailedFor(src);
        else if (onError) onError(e);
      }}
    />
  );
}
