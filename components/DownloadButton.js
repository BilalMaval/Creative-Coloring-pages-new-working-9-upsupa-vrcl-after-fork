'use client';

import { useState } from 'react';
import { Download, Loader2, ShoppingCart, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ReviewPrompt from '@/components/ReviewPrompt';

export default function DownloadButton({ product, gradient, onReviewSubmitted }) {
  const [loading, setLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const router = useRouter();

  const addToCart = () => {
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];

    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.salePrice || product.price,
        isFree: product.isFree,
        image: product.webpPath || product.thumbnailPath,
        category: product.category?.name || '',
        quantity: 1
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    return true;
  };

  // Free download handler — the anchor has a download attribute, which NavigationProgress ignores (no spinner)
  const handleFreeDownload = async () => {
    if (!product.pdfPath) {
      alert('Download file not available. Please contact support.');
      return;
    }

    setLoading(true);

    // Extract the storage key (e.g. "pdfs/filename.pdf") from the full URL.
    // Handles both legacy Supabase URLs (.../uploads/pdfs/...) and new R2
    // URLs (https://cdn.creativecoloringpages.online/pdfs/...) by taking
    // everything after the last occurrence of "/pdfs/" or "/images/".
    const storageKey = product.pdfPath.replace(/^.*?\/(pdfs\/|images\/)/, '$1');
    const filePath = encodeURIComponent(storageKey);

    const fileExt = product.pdfPath.split('.').pop()?.toLowerCase() || 'pdf';
    const fileName = product.title.replace(/[^a-z0-9]/gi, '_') + '.' + fileExt;
    const url = `/api/download?file=${filePath}&name=${encodeURIComponent(fileName)}&productId=${product.id}&format=json`;

    try {
      // The server counts the download and returns a short-lived signed storage link; the browser then downloads
      // it natively (works for large files, no memory use, no page navigation).
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error('Download failed');

      const link = document.createElement('a');
      link.href = data.url;
      link.download = fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadStarted(true);
      setTimeout(() => {
        setDownloadStarted(false);
        // Show review prompt 1 second after the "Download Started!" banner clears
        setShowReviewPrompt(true);
      }, 3000);
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    setLoading(true);
    try {
      addToCart();
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    setLoading(true);
    try {
      addToCart();
      router.push('/checkout');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToCart = () => router.push('/cart');

  if (downloadStarted) {
    return (
      <Button
        disabled
        size="lg"
        className="w-full bg-green-700 text-white font-black text-xl md:text-2xl py-8 rounded-2xl shadow-2xl"
      >
        <Check className="mr-3 h-8 w-8" />
        Download Started!
      </Button>
    );
  }

  if (product.isFree) {
    return (
      <>
        <Button
          onClick={handleFreeDownload}
          disabled={loading}
          size="lg"
          className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-black text-xl md:text-2xl py-8 rounded-2xl shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none`}
        >
          {loading ? (
            <>
              <Loader2 className="mr-3 h-8 w-8 animate-spin" />
              Preparing Download...
            </>
          ) : (
            <>
              <Download className="mr-3 h-8 w-8" />
              Download FREE
            </>
          )}
        </Button>

        {showReviewPrompt && (
          <ReviewPrompt
            product={product}
            onClose={() => setShowReviewPrompt(false)}
            onReviewSubmitted={onReviewSubmitted}
          />
        )}
      </>
    );
  }

  if (addedToCart) {
    return (
      <div className="space-y-2">
        <Button
          disabled
          size="lg"
          className="w-full bg-green-700 text-white font-black text-xl md:text-2xl py-8 rounded-2xl shadow-2xl"
        >
          <Check className="mr-3 h-8 w-8" />
          Added to Cart!
        </Button>
        <Button
          onClick={goToCart}
          variant="outline"
          size="lg"
          className="w-full font-bold text-lg py-6 rounded-xl"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          View Cart & Checkout
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleBuyNow}
        disabled={loading}
        size="lg"
        className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-black text-xl md:text-2xl py-8 rounded-2xl shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none`}
      >
        {loading ? (
          <>
            <Loader2 className="mr-3 h-8 w-8 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Zap className="mr-3 h-8 w-8" />
            Buy Now - ${Number(product.salePrice || product.price).toFixed(2)}
          </>
        )}
      </Button>

      <Button
        onClick={handleAddToCart}
        variant="outline"
        size="lg"
        className="w-full font-bold text-lg py-6 rounded-xl border-2"
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        Add to Cart
      </Button>
    </div>
  );
}
