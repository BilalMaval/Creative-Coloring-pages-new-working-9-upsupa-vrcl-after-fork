'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, CheckCircle } from 'lucide-react';

export default function ContactForm({ brandEmail }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', message: '' });
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-black text-gray-800 mb-2">Message Sent! 🎉</h3>
        <p className="text-gray-600 mb-6">
          Thank you for reaching out. We'll get back to you soon.
        </p>
        <Button 
          onClick={() => setSuccess(false)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-full px-8"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-6 w-6 text-purple-600" />
        <h2 className="text-xl font-black text-gray-800">Send us a message</h2>
      </div>
      
      <div>
        <Label htmlFor="name" className="text-gray-700 font-bold">Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Your name"
          className="mt-1 border-2 border-purple-200 focus:border-purple-500 rounded-xl"
        />
      </div>

      <div>
        <Label htmlFor="email" className="text-gray-700 font-bold">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="your@email.com"
          className="mt-1 border-2 border-purple-200 focus:border-purple-500 rounded-xl"
        />
      </div>

      <div>
        <Label htmlFor="message" className="text-gray-700 font-bold">Message *</Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          placeholder="Your message..."
          rows={6}
          className="mt-1 border-2 border-purple-200 focus:border-purple-500 rounded-xl"
        />
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl border-2 border-red-300 font-bold">
          ⚠️ {error}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black text-lg py-6 rounded-full shadow-lg" 
        disabled={loading}
      >
        {loading ? (
          'Sending...'
        ) : (
          <>
            <Send className="h-5 w-5 mr-2" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
}
