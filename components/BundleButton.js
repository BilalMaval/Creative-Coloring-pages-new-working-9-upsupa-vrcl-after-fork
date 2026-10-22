'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Add a bundle to the cart (one copy; a bundle is a digital download so a second copy is pointless).
export default function BundleButton({ bundle, gradient }) {
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const addToCart = () => {
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch {}
    if (!cart.some((i) => i.id === bundle.id)) {
      cart.push({
        id: bundle.id,
        type: 'bundle',
        slug: bundle.slug,
        title: bundle.title,
        price: bundle.price,
        isFree: false,
        image: bundle.cover || null,
        category: `Bundle · ${bundle.items.length} items`,
        quantity: 1,
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  if (added) {
    return (
      <div className="space-y-2">
        <Button disabled size="lg" className="w-full bg-green-700 text-white font-black text-xl md:text-2xl py-8 rounded-2xl shadow-2xl">
          <Check className="mr-3 h-8 w-8" /> Added to Cart!
        </Button>
        <Button onClick={() => router.push('/cart')} variant="outline" size="lg" className="w-full font-bold text-lg py-6 rounded-xl">
          <ShoppingCart className="mr-2 h-5 w-5" /> View Cart &amp; Checkout
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={() => { addToCart(); router.push('/checkout'); }}
        size="lg"
        className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-black text-xl md:text-2xl py-8 rounded-2xl shadow-2xl transform hover:scale-105 transition-all`}
      >
        <Zap className="mr-3 h-8 w-8" /> Buy Bundle - ${bundle.price.toFixed(2)}
      </Button>
      <Button
        onClick={() => { addToCart(); setAdded(true); setTimeout(() => setAdded(false), 2500); }}
        variant="outline"
        size="lg"
        className="w-full font-bold text-lg py-6 rounded-xl border-2"
      >
        <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
      </Button>
    </div>
  );
}
