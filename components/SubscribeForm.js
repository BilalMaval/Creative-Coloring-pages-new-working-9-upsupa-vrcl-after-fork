'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function SubscribeForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      setStatus({ type: 'error', message: 'Please fill in all fields' });
      return;
    }
    
    setLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStatus({ type: 'success', message: data.message });
        setName('');
        setEmail('');
      } else {
        setStatus({ type: 'error', message: data.error });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-6 w-6 text-white" />
        <h3 className="text-xl font-bold text-white">Subscribe for Updates!</h3>
      </div>
      <p className="text-white/90 text-sm mb-4">
        Get notified about new coloring pages, printables & special offers!
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white/95 border-0"
          disabled={loading}
        />
        <Input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/95 border-0"
          disabled={loading}
        />
        <Button 
          type="submit" 
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Subscribing...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Subscribe Now
            </>
          )}
        </Button>
      </form>
      
      {status.message && (
        <div className={`mt-3 flex items-center gap-2 text-sm ${
          status.type === 'success' ? 'text-green-200' : 'text-red-200'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {status.message}
        </div>
      )}
    </div>
  );
}
