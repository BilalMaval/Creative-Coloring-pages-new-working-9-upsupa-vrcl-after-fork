import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isBot } from '@/lib/bots';

export const runtime = 'nodejs';

// POST /api/views  body: { productId }
// Counts a product page view for a real visitor. Automated traffic is answered immediately WITHOUT touching the
// database, so bot bursts no longer cost a database write each. (The page also only sends this after the visitor has
// stayed a few seconds, once per browser session; see ProductPageClient.js.)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Per server instance: the same visitor reloading the same product is counted once per 30 minutes, and one IP
// cannot count more than 40 views a minute.
const seen = new Map();
const perIp = new Map();
const DEDUPE_MS = 30 * 60_000;

function allowed(ip, productId) {
  const now = Date.now();
  const key = `${ip}:${productId}`;
  const last = seen.get(key);
  if (last && now - last < DEDUPE_MS) return false;

  const recent = (perIp.get(ip) || []).filter((t) => now - t < 60_000);
  if (recent.length >= 40) { perIp.set(ip, recent); return false; }
  recent.push(now);
  perIp.set(ip, recent);

  seen.set(key, now);
  if (seen.size > 5000) { for (const [k, t] of seen) if (now - t > DEDUPE_MS) seen.delete(k); if (seen.size > 5000) seen.clear(); }
  if (perIp.size > 5000) perIp.clear();
  return true;
}

export async function POST(request) {
  try {
    if (isBot(request.headers.get('user-agent'))) {
      return new NextResponse(null, { status: 204 });
    }

    const { productId } = await request.json().catch(() => ({}));
    if (!productId || !UUID.test(String(productId))) {
      return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!allowed(ip, productId)) return new NextResponse(null, { status: 204 });

    // One atomic statement (was: read the value, then write value + 1)
    await prisma.product.updateMany({ where: { id: productId }, data: { views: { increment: 1 } } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to increment view count:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
