'use client';

import Link from 'next/link';
import ThumbImage from '@/components/ThumbImage';
import BundleButton from '@/components/BundleButton';
import BundleCard, { BundleCover } from '@/components/BundleCard';
import { unitPrice } from '@/lib/bundlePricing';

export default function BundlePageClient({ bundle, others }) {
  const gradient = 'from-pink-500 to-purple-500';

  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8 flex-wrap">
          <Link href="/" className="hover:text-blue-600 font-bold">Home</Link>
          <span>›</span>
          <Link href="/bundles" className="hover:text-blue-600 font-bold">Bundles</Link>
          <span>›</span>
          <span className="text-gray-800 font-bold">{bundle.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Cover */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <div className="aspect-[4/3] relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              <BundleCover bundle={bundle} priority sizes="(max-width: 1024px) 100vw, 50vw" />
              {bundle.percentOff > 0 && (
                <div className="absolute top-3 right-3 bg-red-500 text-white font-black px-3 py-1.5 rounded-full shadow-lg">
                  SAVE {bundle.percentOff}%
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <p className="text-sm font-black text-pink-600 mb-2">🎁 BUNDLE · {bundle.items.length} PRINTABLES</p>
              <h1 className="text-3xl md:text-5xl font-black text-gray-800 mb-4">{bundle.title}</h1>
              {bundle.description && (
                <p className="text-gray-700 text-lg leading-relaxed mb-6 whitespace-pre-line">{bundle.description}</p>
              )}

              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-center py-6 px-8 rounded-2xl shadow-xl mb-4">
                {bundle.savings > 0 && (
                  <p className="text-lg line-through opacity-60 mb-0.5">${bundle.regularTotal.toFixed(2)} if bought separately</p>
                )}
                <p className="text-4xl font-black mb-1">${bundle.price.toFixed(2)}</p>
                {bundle.savings > 0 ? (
                  <p className="text-sm font-bold bg-red-600 text-white rounded-full px-3 py-0.5 inline-block">
                    You save ${bundle.savings.toFixed(2)} ({bundle.percentOff}% off)
                  </p>
                ) : (
                  <p className="text-sm font-bold">One-time purchase</p>
                )}
              </div>

              <BundleButton bundle={bundle} gradient={gradient} />

              {bundle.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {bundle.tags.map((t) => (
                    <span key={t} className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">#{t}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <h3 className="font-black text-xl mb-4 text-gray-800">What you get:</h3>
              <ul className="space-y-3">
                {['Every printable listed below in one purchase', 'High-quality files ready to print', 'Instant download after checkout', 'Print as many times as you like'].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="bg-green-100 text-green-600 rounded-full p-2">✓</span>
                    <span className="font-bold text-gray-700">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contents */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-xl mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-6">Inside this bundle ({bundle.items.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bundle.items.map((item) => (
              <Link key={item.id} href={`/product/${item.slug}`} className="block group">
                <div className="rounded-xl border-2 border-gray-200 group-hover:border-blue-400 p-2 transition-colors h-full">
                  <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-gray-100 mb-2">
                    {item.webpPath ? (
                      <ThumbImage src={item.webpPath} alt={item.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, 20vw" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-3xl">🎨</div>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-800 line-clamp-2">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {unitPrice(item) === 0 ? 'Free' : `Worth $${unitPrice(item).toFixed(2)}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {others.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-6">More bundles you may like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {others.map((b) => <BundleCard key={b.id} bundle={b} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
