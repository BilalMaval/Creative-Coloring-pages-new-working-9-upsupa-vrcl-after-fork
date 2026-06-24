'use client';

import { useState } from 'react';
import { Star, X, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-125"
        >
          <Star
            className={`h-8 w-8 ${
              star <= (hovered || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Amazing!'];

export default function ReviewPrompt({ product, onClose, onReviewSubmitted }) {
  const [step, setStep]         = useState('rate');
  const [rating, setRating]     = useState(0);
  const [name, setName]         = useState('');
  const [comment, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!product) return null;

  const handleRatingSelect = (r) => {
    setRating(r);
    setTimeout(() => setStep('form'), 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId:   product.id,
          productSlug: product.slug,
          rating,
          authorName:  name.trim(),
          comment:     comment.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to submit review. Please try again.');
        return;
      }
      // Pass the saved review directly to the parent so ReviewSection can show it immediately
      onReviewSubmitted?.({
        id:         data.data.id,
        rating,
        authorName: name.trim(),
        comment:    comment.trim(),
        title:      null,
        createdAt:  data.data.createdAt || new Date().toISOString(),
        isVerified: false,
      });
      setStep('done');
      setTimeout(onClose, 2500);
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step 1: Quick star pick */}
        {step === 'rate' && (
          <div className="p-8 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-black text-gray-800 mb-1">
              Download complete!
            </h2>
            <p className="text-gray-500 font-medium mb-6 text-sm">
              How would you rate{' '}
              <span className="font-bold text-gray-700">{product.title}</span>?
            </p>
            <div className="flex justify-center mb-2">
              <StarPicker value={rating} onChange={handleRatingSelect} />
            </div>
            {rating > 0 && (
              <p className="text-purple-600 font-bold text-sm">{LABELS[rating]}</p>
            )}
            <button
              onClick={onClose}
              className="mt-6 text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Skip, no thanks
            </button>
          </div>
        )}

        {/* Step 2: Name + comment */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-5 w-5 ${
                      s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-black text-gray-800">{LABELS[rating]}</span>
              <button
                type="button"
                onClick={() => setStep('rate')}
                className="ml-auto text-xs text-purple-500 hover:underline"
              >
                Change
              </button>
            </div>

            <h2 className="text-xl font-black text-gray-800 mb-4">
              Tell us what you think
            </h2>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Your name <span className="text-red-400">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emily"
                  required
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Share your experience{' '}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="My kids loved this page! Printed perfectly on A4…"
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-xl py-3"
            >
              {submitting ? (
                'Submitting…'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Review
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="block mx-auto mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Skip
            </button>
          </form>
        )}

        {/* Step 3: Thank you */}
        {step === 'done' && (
          <div className="p-10 text-center">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-800 mb-2">Thank you!</h2>
            <p className="text-gray-500">
              Your review helps other families find great coloring pages.
            </p>
          </div>
        )}

        <div className="h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400" />
      </div>
    </div>
  );
}
