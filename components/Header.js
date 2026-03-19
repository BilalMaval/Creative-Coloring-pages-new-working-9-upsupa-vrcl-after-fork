'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, Sparkles, ShoppingCart, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrand } from '@/components/BrandProvider';

export default function Header() {
  const brand = useBrand();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Check if admin is logged in
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success && data.user?.role === 'ADMIN') {
          setIsAdmin(true);
        }
      } catch (error) {
        // Not logged in
      }
    };
    checkAdmin();
    
    // Get cart count
    const updateCartCount = () => {
      const cart = localStorage.getItem('cart');
      if (cart) {
        const items = JSON.parse(cart);
        setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
      } else {
        setCartCount(0);
      }
    };
    
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full border-b-4 border-${brand.colors.headerBorder} bg-white shadow-lg`}>
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative h-16 w-16">
              <Image
                src={brand.logo}
                alt={`${brand.name} Logo`}
                fill
                className="object-contain group-hover:scale-110 transition-transform"
                priority
              />
            </div>
            <div className="hidden lg:block">
              <div className="font-black text-xl text-gray-800 flex items-center gap-2">
                <Sparkles className={`h-5 w-5 text-${brand.colors.primary}-500`} />
                {brand.name}
              </div>
              <div className={`text-xs text-${brand.colors.primary}-600 font-bold`}>{brand.tagline}</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-3">
            <Link href="/collection/coloring-pages">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-base rounded-full h-11 px-6 shadow-md">
                🎨 Coloring Pages
              </Button>
            </Link>
            <Link href="/collection/calendars">
              <Button className="bg-green-500 hover:bg-green-600 text-white font-bold text-base rounded-full h-11 px-6 shadow-md">
                📅 Calendars
              </Button>
            </Link>
            <Link href="/collection/printables">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-base rounded-full h-11 px-6 shadow-md">
                📄 Printables
              </Button>
            </Link>
            <Link href="/collection/bookshop">
              <Button className="bg-purple-500 hover:bg-purple-600 text-white font-bold text-base rounded-full h-11 px-6 shadow-md">
                📚 Book Shop
              </Button>
            </Link>
            <Link href="/search">
              <Button className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-base rounded-full h-11 px-6 shadow-md">
                🔍 Search
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline" className="bg-white hover:bg-gray-100 font-bold text-base rounded-full h-11 px-4 shadow-md border-2 border-gray-300 relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" className="bg-gray-800 hover:bg-gray-900 text-white font-bold text-sm rounded-full h-11 px-4 shadow-md">
                  <Settings className="h-4 w-4 mr-1" />
                  Manage
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden bg-${brand.colors.primary}-500 rounded-xl p-3 shadow-lg`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-3 pb-6">
            <Link
              href="/collection/coloring-pages"
              className="block"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-full h-14 shadow-md">
                🎨 Coloring Pages
              </Button>
            </Link>
            <Link
              href="/collection/calendars"
              className="block"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-full h-14 shadow-md">
                📅 Calendars
              </Button>
            </Link>
            <Link
              href="/collection/printables"
              className="block"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-full h-14 shadow-md">
                📄 Printables
              </Button>
            </Link>
            <Link
              href="/collection/bookshop"
              className="block"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg rounded-full h-14 shadow-md">
                📚 Book Shop
              </Button>
            </Link>
            <Link
              href="/search"
              className="block"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-lg rounded-full h-14 shadow-md">
                🔍 Search
              </Button>
            </Link>
            <Link
              href="/about"
              className="block"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold text-lg rounded-full h-14 shadow-md">
                ❓ About
              </Button>
            </Link>
            <Link
              href="/cart"
              className="block"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button className="w-full bg-white hover:bg-gray-100 text-gray-800 font-bold text-lg rounded-full h-14 shadow-md border-2 border-gray-300">
                🛒 Cart {cartCount > 0 && `(${cartCount})`}
              </Button>
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="block"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold text-lg rounded-full h-14 shadow-md">
                  ⚙️ Manage
                </Button>
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
