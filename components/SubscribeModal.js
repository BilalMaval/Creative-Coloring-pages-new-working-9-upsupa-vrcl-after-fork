'use client';

import { useState } from 'react';
import { X, Mail, User, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBrand } from '@/components/BrandProvider';

export default function SubscribeModal({ isOpen, onClose }) {
  const brand = useBrand();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setName('');
        setEmail('');
        // Auto close after 3 seconds on success
        setTimeout(() => {
          onClose();
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to subscribe. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-purple-400 animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center gap-2 mb-3">
            <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
            <Heart className="h-8 w-8 text-pink-500 animate-pulse" />
            <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Join Our Newsletter!
          </h2>
          <p className="text-gray-600 font-medium mt-2">
            Get FREE coloring pages & updates from {brand.name}! 🎨
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="pl-10 py-6 text-lg border-2 border-purple-200 focus:border-purple-500 rounded-xl"
            />
          </div>
          
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 py-6 text-lg border-2 border-purple-200 focus:border-purple-500 rounded-xl"
            />
          </div>

          {/* Message */}
          {message.text && (
            <div className={`p-3 rounded-xl text-center font-bold ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 border-2 border-green-400' 
                : 'bg-red-100 text-red-700 border-2 border-red-400'
            }`}>
              {message.type === 'success' ? '🎉 ' : '⚠️ '}{message.text}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black text-lg py-6 rounded-xl shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">🎨</span> Subscribing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Mail className="h-5 w-5" /> Subscribe Now!
              </span>
            )}
          </Button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          We respect your privacy. Unsubscribe anytime! 💜
        </p>
      </div>
    </div>
  );
}
