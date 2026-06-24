'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, CheckCircle, AlertCircle, X, Bell } from 'lucide-react';

export default function SubscribeSection() {
  const [isOpen, setIsOpen] = useState(false);
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
        // Close modal after 3 seconds on success
        setTimeout(() => {
          setIsOpen(false);
          setStatus({ type: '', message: '' });
        }, 3000);
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
    <section className="container mx-auto px-4 mb-8">
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-3xl p-8 shadow-2xl text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl">📬</div>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            Never Miss New Coloring Pages!
          </h2>
          <p className="text-white font-bold text-lg max-w-xl">
            Get notified about new coloring pages, printables & special offers!
          </p>
          
          {!isOpen ? (
            <Button 
              onClick={() => setIsOpen(true)}
              className="bg-white text-purple-600 hover:bg-gray-100 font-black text-lg py-6 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              <Bell className="h-5 w-5 mr-2" />
              Subscribe Now - It's FREE!
            </Button>
          ) : (
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative animate-in fade-in zoom-in duration-300">
              <button 
                onClick={() => { setIsOpen(false); setStatus({ type: '', message: '' }); }}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <Mail className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-800">Subscribe for Updates</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-2 border-purple-200 focus:border-purple-500"
                  disabled={loading}
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-2 border-purple-200 focus:border-purple-500"
                  disabled={loading}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-5"
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
                <div className={`mt-3 flex items-center justify-center gap-2 text-sm ${
                  status.type === 'success' ? 'text-green-600' : 'text-red-600'
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
          )}
        </div>
      </div>
    </section>
  );
}
