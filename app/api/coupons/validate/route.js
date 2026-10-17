import { NextResponse } from 'next/server';
import { priceItems, evaluateCoupon } from '@/lib/coupons';

export const runtime = 'nodejs';

// Light per-IP throttle (per server instance) to make code-guessing impractical
const hits = new Map();
function tooMany(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 15;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (tooMany(ip)) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Please wait a minute.' }, { status: 429 });
    }

    const { code, items, email } = await request.json();
    if (!code || !String(code).trim()) {
      return NextResponse.json({ success: false, error: 'Enter a coupon code' }, { status: 400 });
    }

    const { subtotal } = await priceItems(items);
    const r = await evaluateCoupon(code, subtotal, email ? String(email) : '');
    if (!r.ok) return NextResponse.json({ success: false, error: r.error }, { status: 400 });

    return NextResponse.json({
      success: true,
      subtotal,
      discount: r.discount,
      total: r.total,
      coupon: {
        code: r.coupon.code, description: r.coupon.description, type: r.coupon.type, value: r.coupon.value,
        expiresAt: r.coupon.expiresAt ? new Date(r.coupon.expiresAt).toISOString() : null, endTimezone: r.coupon.endTimezone,
      },
    });
  } catch (error) {
    console.error('Coupon validate error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not check coupon' }, { status: 400 });
  }
}
