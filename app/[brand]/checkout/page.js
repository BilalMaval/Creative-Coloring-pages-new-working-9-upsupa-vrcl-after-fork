'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, CreditCard, Lock, ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [completedItems, setCompletedItems] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    name: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const items = JSON.parse(savedCart);
      if (items.length === 0) {
        router.push('/cart');
        return;
      }
      setCartItems(items);
    } else {
      router.push('/cart');
    }
    setLoading(false);
  }, [router]);

  const updateCart = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    if (newCart.length === 0) {
      router.push('/cart');
    }
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

  const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          customerName: formData.name,
          items: cartItems.map(item => ({
            productId: item.id,
            title: item.title,
            price: parseFloat(item.price) || 0,
            quantity: item.quantity
          }))
        })
      });

      const data = await res.json();

      if (data.success) {
        setOrderNumber(data.orderNumber);
        setCompletedItems([...cartItems]);
        setOrderComplete(true);
        // Clear cart
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        setError(data.error || 'Failed to process order');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

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

  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-2">Order Complete!</h1>
              <p className="text-xl text-muted-foreground mb-4">
                Order #{orderNumber}
              </p>
              <p className="text-muted-foreground mb-6">
                Thank you for your purchase! Your downloads are ready.
              </p>
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3">Your Downloads:</h3>
                <div className="space-y-2">
                  {completedItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded">
                      <span>{item.title}</span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/product/${item.slug}`}>Download</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/">
                <Button size="lg">
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/cart" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Cart
      </Link>
      
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Checkout Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="your@email.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Order confirmation will be sent to this email
                  </p>
                </div>

                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Your full name"
                  />
                </div>

                {total > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Demo Mode:</strong> This is a mock checkout. No real payment will be processed.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={processing || cartItems.length === 0}>
                  {processing ? 'Processing...' : total === 0 ? 'Complete Free Order' : `Pay $${total.toFixed(2)}`}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Secure checkout</span>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary with Edit Capability */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <p className="text-sm text-muted-foreground">You can modify your order below</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.image || '/placeholder.png'}
                        alt={item.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-sm font-semibold mt-1">
                        {item.isFree || parseFloat(item.price) === 0 ? 'FREE' : `$${(parseFloat(item.price) * item.quantity).toFixed(2)}`}
                      </p>
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{total === 0 ? 'FREE' : `$${total.toFixed(2)}`}</span>
                  </div>
                </div>
                
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full" size="sm">
                    + Add More Items
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
