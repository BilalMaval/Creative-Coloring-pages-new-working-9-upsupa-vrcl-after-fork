import Link from 'next/link';
import ThumbImage from '@/components/ThumbImage';
import { Package } from 'lucide-react';

// Cover for a bundle: the admin's cover image if there is one, otherwise a 2x2 collage of the products inside.
export function BundleCover({ bundle, priority = false, sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' }) {
  if (bundle.image) {
    return <ThumbImage src={bundle.image} alt={bundle.title} fill className="object-cover" sizes={sizes} priority={priority} />;
  }
  const imgs = bundle.previewImages || [];
  if (imgs.length === 0) {
    return <div className="flex items-center justify-center h-full text-5xl">🎁</div>;
  }
  return (
    <div className={`grid h-full w-full gap-0.5 bg-white ${imgs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {imgs.slice(0, 4).map((src, i) => (
        <div key={i} className="relative overflow-hidden">
          <ThumbImage src={src} alt="" fill className="object-cover" sizes="25vw" priority={priority && i === 0} />
        </div>
      ))}
    </div>
  );
}

export default function BundleCard({ bundle, priority = false }) {
  const n = bundle.items.length;
  return (
    <Link href={`/bundle/${bundle.slug}`} className="block">
      <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-gray-200 hover:border-pink-400 h-full">
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 relative overflow-hidden">
          <BundleCover bundle={bundle} priority={priority} />
          {bundle.percentOff > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full shadow">
              SAVE {bundle.percentOff}%
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Package className="h-3 w-3" /> {n} {n === 1 ? 'item' : 'items'}
          </div>
        </div>
        <h3 className="font-black text-gray-800 text-base leading-tight line-clamp-2 mb-2">{bundle.title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-pink-600">${bundle.price.toFixed(2)}</span>
          {bundle.savings > 0 && (
            <span className="text-sm text-gray-500 line-through">${bundle.regularTotal.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
