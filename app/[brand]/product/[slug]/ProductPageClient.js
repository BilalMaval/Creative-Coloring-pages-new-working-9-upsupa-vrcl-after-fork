'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThumbImage from '@/components/ThumbImage';
import { ArrowLeft, Tag, Calendar, Eye, Heart, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DownloadButton from '@/components/DownloadButton';
import ReviewSection from '@/components/ReviewSection';
import PhotoGallery from '@/components/PhotoGallery';
import BookParameters from '@/components/BookParameters';

export default function ProductPageClient({ product, relatedProducts, bundles = [], gradient }) {
  // Reviews submitted via the prompt are added here and passed directly to ReviewSection
  const [pendingReviews, setPendingReviews] = useState([]);

  // Count a view only for a real visitor: the tab must be visible after 3 seconds, and each product counts once per browser
  // session. Automated visitors are ignored on the server as well (lib/bots.js), so this is also a cheap first filter.
  useEffect(() => {
    if (!product?.id || navigator.webdriver) return undefined;
    const key = `viewed:${product.id}`;
    try { if (sessionStorage.getItem(key)) return undefined; } catch {}
    const timer = setTimeout(() => {
      if (document.visibilityState !== 'visible') return;
      try { sessionStorage.setItem(key, '1'); } catch {}
      fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
        keepalive: true,
      }).catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [product?.id]);
  const formattedDate = new Date(product.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Check if this is a Bookshop or Printables product (for gallery)
  const parentSlug = product.category?.parent?.slug;
  const showGallery = parentSlug === 'bookshop' || parentSlug === 'printables';
  const showBookParams = parentSlug === 'bookshop';
  
  // For gallery - combine main image with gallery images
  const hasGalleryImages = product.gallery && product.gallery.length > 0;

  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8 flex-wrap">
          <Link href="/" className="hover:text-blue-600 transition-colors font-bold">
            Home
          </Link>
          <span>›</span>
          {product.category?.parent && (
            <>
              <Link href={`/collection/${product.category.parent.slug}`} className="hover:text-blue-600 transition-colors font-bold">
                {product.category.parent.name}
              </Link>
              <span>›</span>
            </>
          )}
          {product.category && (
            <>
              <Link href={`/category/${product.category.slug}`} className="hover:text-blue-600 transition-colors font-bold">
                {product.category.name}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-gray-800 font-bold">{product.title}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Section */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            {/* Photo Gallery with Zoom - handles main image and gallery */}
            <PhotoGallery 
              images={product.gallery || []} 
              mainImage={product.webpPath}
              title={product.title}
            />
            
            {/* Stats - Downloads and Views */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center bg-blue-50 rounded-xl p-3">
                <Download className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-black text-gray-800">{product.downloads || 0}</p>
                <p className="text-xs text-gray-600 font-bold">Downloads</p>
              </div>
              <div className="text-center bg-purple-50 rounded-xl p-3">
                <Eye className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-black text-gray-800">{product.views || 0}</p>
                <p className="text-xs text-gray-600 font-bold">Views</p>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-5xl font-black text-gray-800 mb-4">
                    {product.title}
                  </h1>
                  {product.category && (
                    <Link href={`/category/${product.category.slug}`}>
                      <div className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-4 py-2 rounded-full">
                        <Tag className="h-4 w-4" />
                        {product.category.name}
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              {product.description && (
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  {product.description}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <Calendar className="h-4 w-4" />
                <span>Added on {formattedDate}</span>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-700 mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Download/Purchase Button */}
              <div className="space-y-3">
                {product.isFree ? (
                  <div className={`bg-gradient-to-r ${gradient} text-white text-center py-6 px-8 rounded-2xl shadow-xl`}>
                    <p className="text-2xl md:text-3xl font-black mb-2">100% FREE!</p>
                    <p className="text-sm font-bold opacity-90">Download and print unlimited times</p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-center py-6 px-8 rounded-2xl shadow-xl">
                    {product.salePrice ? (
                      <>
                        <p className="text-lg line-through opacity-60 mb-0.5">${Number(product.price).toFixed(2)}</p>
                        <p className="text-3xl font-black mb-1">${Number(product.salePrice).toFixed(2)}</p>
                        <p className="text-xs font-bold bg-red-600 text-white rounded-full px-3 py-0.5 inline-block mb-1">SALE</p>
                      </>
                    ) : (
                      <p className="text-3xl font-black mb-1">${Number(product.price).toFixed(2)}</p>
                    )}
                    <p className="text-sm font-bold">One-time purchase</p>
                  </div>
                )}
                
                <DownloadButton
                  product={product}
                  gradient={gradient}
                  onReviewSubmitted={(review) => setPendingReviews(prev => [review, ...prev])}
                />

                <div className="flex gap-2">
                  <Button variant="outline" size="lg" className="flex-1 font-bold">
                    <Heart className="mr-2 h-5 w-5" />
                    Save
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1 font-bold">
                    <Share2 className="mr-2 h-5 w-5" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Also available in a bundle */}
            {bundles.length > 0 && (
              <Card className="shadow-xl border-2 border-pink-200 bg-pink-50">
                <CardContent className="p-6">
                  <h3 className="font-black text-xl mb-3 text-gray-800">🎁 Also available in a bundle</h3>
                  <div className="space-y-2">
                    {bundles.map((b) => (
                      <Link key={b.id} href={`/bundle/${b.slug}`} className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-pink-200 hover:border-pink-400 transition-colors">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 truncate">{b.title}</p>
                          <p className="text-xs text-gray-600">{b.items.length} printables{b.percentOff > 0 ? ` · save ${b.percentOff}%` : ''}</p>
                        </div>
                        <span className="font-black text-pink-600 whitespace-nowrap">${b.price.toFixed(2)}</span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Book Parameters for Bookshop products */}
            {showBookParams && <BookParameters product={product} />}

            {/* Features Card */}
            <Card className="shadow-xl">
              <CardContent className="p-6">
                <h3 className="font-black text-xl mb-4 text-gray-800">What You Get:</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="bg-green-100 text-green-600 rounded-full p-2">✓</span>
                    <span className="font-bold text-gray-700">High-quality printable PDF</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-green-100 text-green-600 rounded-full p-2">✓</span>
                    <span className="font-bold text-gray-700">Print unlimited times</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-green-100 text-green-600 rounded-full p-2">✓</span>
                    <span className="font-bold text-gray-700">Instant download</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-green-100 text-green-600 rounded-full p-2">✓</span>
                    <span className="font-bold text-gray-700">Perfect for home or school</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="review-section" className="mb-12">
          <ReviewSection
            productId={product.id}
            productSlug={product.slug}
            pendingReviews={pendingReviews}
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <div className="bg-white rounded-3xl p-8 shadow-xl mb-6">
              <h2 className="text-3xl md:text-4xl font-black text-gray-800 text-center">
                ✨ You Might Also Like
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {relatedProducts.map((related) => (
                <Link key={related.id} href={`/product/${related.slug}`} aria-label={`Download ${related.title} - Free Printable`}>
                  <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-gray-200 hover:border-blue-400">
                    <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 relative overflow-hidden">
                      {related.webpPath ? (
                        <ThumbImage
                          src={related.webpPath}
                          alt={related.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-4xl">🎨</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-black text-center text-gray-800 text-xs md:text-sm line-clamp-2">
                      {related.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center">
          {product.category && (
            <Link href={`/category/${product.category.slug}`}>
              <Button size="lg" className={`bg-gradient-to-r ${gradient} text-white font-black text-xl py-6 px-12 rounded-full shadow-2xl border-4 border-white transform hover:scale-110 transition-all`}>
                <ArrowLeft className="mr-2 h-6 w-6" />
                Back to {product.category.name}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
