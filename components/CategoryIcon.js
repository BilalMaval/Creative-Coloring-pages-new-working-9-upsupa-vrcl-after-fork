'use client';

import { useState } from 'react';
import ThumbImage from '@/components/ThumbImage';

// Renders the category's uploaded icon image, but falls back to the emoji
// if the image fails to load (e.g. Vercel Image Optimization quota hit) —
// rather than picking image-or-emoji at render time based on data alone.
export default function CategoryIcon({ iconImage, emoji, name, size = 80 }) {
  const [failed, setFailed] = useState(false);

  if (!iconImage || failed) {
    return <span className="text-5xl">{emoji || '🎨'}</span>;
  }

  return (
    <ThumbImage
      src={iconImage}
      alt={name}
      width={size}
      height={size}
      className="object-contain"
      onError={() => setFailed(true)}
    />
  );
}
