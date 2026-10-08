'use client';

import { useState } from 'react';
import Image from 'next/image';
import { thumbUrl } from '@/lib/images';

// Renders the small WebP thumbnail of a CDN image; falls back to the original if the thumbnail is missing.
export default function ThumbImage({ src, onError, ...props }) {
  const thumb = thumbUrl(src);
  const [failedFor, setFailedFor] = useState(null);
  const current = failedFor === src ? src : thumb;

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
