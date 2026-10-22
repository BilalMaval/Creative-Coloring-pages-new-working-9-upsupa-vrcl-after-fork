'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, X, CheckCircle } from 'lucide-react';
import { formatInZone } from '@/lib/timezones';

const STORAGE_KEY = 'appliedCoupon';
const readSaved = () => { try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; } };
const writeSaved = (code) => { try { code ? localStorage.setItem(STORAGE_KEY, code) : localStorage.removeItem(STORAGE_KEY); } catch {} };

// Coupon entry used on the cart and checkout pages. The applied code is remembered between the two pages
// and is re-checked against the server whenever the cart or email changes.
// onChange receives { code, discount, total, subtotal } or null.
export default function CouponBox({ items, email = '', onChange }) {
  const [input, setInput] = useState('');
  const [applied, setApplied] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const itemsKey = JSON.stringify((items || []).map((i) => [i.id, i.quantity]));

  const check = async (code, { silent = false } = {}) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          email,
          items: (items || []).map((i) => (i.type === 'bundle' ? { bundleId: i.id, quantity: i.quantity } : { productId: i.id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const a = { code: data.coupon.code, description: data.coupon.description, discount: data.discount, total: data.total, subtotal: data.subtotal, endsAt: data.coupon.expiresAt, endZone: data.coupon.endTimezone };
        setApplied(a);
        writeSaved(a.code);
        onChangeRef.current?.(a);
        setInput('');
      } else {
        setApplied(null);
        onChangeRef.current?.(null);
        if (!silent) setError(data.error || 'Could not apply coupon');
        writeSaved('');
      }
    } catch {
      if (!silent) setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Re-validate a saved coupon when the cart (or email) changes, so totals never go stale
  useEffect(() => {
    if (!items || items.length === 0) return;
    const code = applied?.code || readSaved();
    if (code) check(code, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, email]);

  const remove = () => {
    setApplied(null);
    setError('');
    writeSaved('');
    onChangeRef.current?.(null);
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-green-800 truncate">{applied.code} applied</p>
            <p className="text-xs text-green-700">You save ${applied.discount.toFixed(2)}</p>
            {applied.endsAt && <p className="text-xs text-green-700">Ends {formatInZone(applied.endsAt, applied.endZone)}</p>}
          </div>
        </div>
        <button type="button" onClick={remove} className="text-green-800 hover:text-green-950 p-1" aria-label="Remove coupon">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (input.trim()) check(input.trim()); } }}
            placeholder="Coupon code"
            className="pl-9 uppercase"
            maxLength={32}
            aria-label="Coupon code"
          />
        </div>
        <Button type="button" variant="outline" disabled={busy || !input.trim()} onClick={() => check(input.trim())}>
          {busy ? 'Checking...' : 'Apply'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
