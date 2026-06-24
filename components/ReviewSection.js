'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, User, ThumbsUp, MessageSquare, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PAGE_SIZE = 5;

function StarRating({ rating, size = 'md' }) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7' };
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function InteractiveStars({ value, onChange }) {
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
              star <= (hovered || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductRating({ rating, reviewCount, size = 'sm' }) {
  return (
    <div className="flex items-center gap-2">
      <StarRating rating={Math.round(rating)} size={size} />
      <span className="text-sm font-bold text-gray-600">
        {rating > 0 ? rating.toFixed(1) : 'No ratings'}
        {reviewCount > 0 && <span className="text-gray-400"> ({reviewCount})</span>}
      </span>
    </div>
  );
}

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'newest',   label: 'Newest' },
  { key: 'best',     label: 'Best (5★)' },
  { key: 'critical', label: 'Critical (1–2★)' },
];

function applyFilter(reviews, filter) {
  switch (filter) {
    case 'newest':   return [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'best':     return reviews.filter(r => r.rating >= 5);
    case 'critical': return reviews.filter(r => r.rating <= 2);
    default:         return reviews;
  }
}

function RatingBreakdown({ reviews }) {
  const total = reviews.length;
  if (total === 0) return null;
  return (
    <div className="space-y-1.5 w-full max-w-xs">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter(r => r.rating === star).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-4 text-right font-bold">{star}</span>
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-yellow-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 text-right text-gray-400">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ReviewSection({ productId, productSlug, pendingReviews = [] }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ count: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ rating: 5, title: '', comment: '', authorName: '', authorEmail: '' });

  const fetchReviews = useCallback(async () => {
    try {
      const param = productId ? `productId=${productId}` : `slug=${productSlug}`;
      const res = await fetch(`/api/reviews?${param}&_=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, productSlug]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // Merge pending (just-submitted) reviews; deduplicate by id
  const fetchedIds = new Set(reviews.map(r => r.id));
  const allReviews = [...pendingReviews.filter(r => !fetchedIds.has(r.id)), ...reviews];
  const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
  const displayStats = allReviews.length > 0
    ? { count: allReviews.length, averageRating: Math.round((totalRating / allReviews.length) * 10) / 10 }
    : stats;

  const filtered = applyFilter(allReviews, activeFilter);
  const visible = filtered.slice(0, visibleCount);

  const handleFilterChange = (key) => {
    setActiveFilter(key);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.authorName || !formData.rating) { alert('Please enter your name and rating'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productSlug, ...formData }),
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ rating: 5, title: '', comment: '', authorName: '', authorEmail: '' });
        setShowForm(false);
        await fetchReviews();
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch {
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2 mb-3">
            <MessageSquare className="h-6 w-6 text-blue-500" />
            Customer Reviews
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-gray-800">
                {displayStats.averageRating > 0 ? displayStats.averageRating.toFixed(1) : '—'}
              </span>
              <div>
                <StarRating rating={Math.round(displayStats.averageRating)} size="md" />
                <p className="text-sm text-gray-500 mt-0.5">{displayStats.count} {displayStats.count === 1 ? 'review' : 'reviews'}</p>
              </div>
            </div>
            <RatingBreakdown reviews={allReviews} />
          </div>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shrink-0"
        >
          Write a Review
        </Button>
      </div>

      {/* Inline review form */}
      {showForm && (
        <Card className="mb-6 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Share Your Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Rating *</label>
                <InteractiveStars value={formData.rating} onChange={(r) => setFormData({ ...formData, rating: r })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Your Name *</label>
                  <Input value={formData.authorName} onChange={(e) => setFormData({ ...formData, authorName: e.target.value })} placeholder="John Doe" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email (optional)</label>
                  <Input type="email" value={formData.authorEmail} onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })} placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Review Title</label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Great coloring page!" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Your Review</label>
                <Textarea value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} placeholder="Tell others about your experience..." rows={4} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="flex-1">{submitting ? 'Submitting...' : 'Submit Review'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      {allReviews.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map(({ key, label }) => {
            const count = key === 'all' ? allReviews.length : applyFilter(allReviews, key).length;
            if (key !== 'all' && count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => handleFilterChange(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${
                  activeFilter === key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {label}
                <span className={`ml-1.5 text-xs ${activeFilter === key ? 'opacity-80' : 'text-gray-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <Star className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">
            {allReviews.length === 0 ? 'No reviews yet' : 'No reviews match this filter'}
          </p>
          {allReviews.length === 0 && (
            <p className="text-sm text-gray-400">Be the first to review this coloring page!</p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {visible.map((review) => (
              <div key={review.id} className="flex gap-3 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-full p-2 h-fit shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800 text-sm">{review.authorName}</span>
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-gray-400 ml-auto">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.title && <p className="font-bold text-gray-800 text-sm mb-0.5">{review.title}</p>}
                  {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
                  {review.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-bold mt-1.5">
                      <ThumbsUp className="h-3 w-3" /> Verified Purchase
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-2xl transition-all"
            >
              <ChevronDown className="h-4 w-4" />
              Show more reviews ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}
