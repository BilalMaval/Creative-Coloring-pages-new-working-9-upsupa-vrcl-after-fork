'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    setLoading(false);
  }, []);

  const updateCart = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    // Dispatch event for header cart count update
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (productId) => {
    const newCart = cartItems.filter(item => item.id !== productId);
    updateCart(newCart);
  };

  const updateQuantity = (productId, delta) => {
    const newCart = cartItems.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    updateCart(newCart);
  };

  const clearCart = () => {
    updateCart([]);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0);
  const total = subtotal; // No tax for digital products

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ShoppingBag className="h-8 w-8" />
        Your Cart
      </h1>

      {cartItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Browse our collections and add some items to your cart!
            </p>
            <Link href="/">
              <Button>
                Continue Shopping
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={item.image || '/placeholder.png'}
                        alt={item.title}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <Link href={`/product/${item.slug}`} className="font-semibold hover:text-primary">
                        {item.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <span className="font-semibold">
                          {parseFloat(item.price) === 0 ? 'FREE' : `$${(parseFloat(item.price) * item.quantity).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button variant="outline" onClick={clearCart} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>{subtotal === 0 ? 'FREE' : `$${subtotal.toFixed(2)}`}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{total === 0 ? 'FREE' : `$${total.toFixed(2)}`}</span>
                  </div>
                </div>
                <Link href="/checkout" className="block">
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center">
                  Secure checkout • Instant download after purchase
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
