import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { brandFromRequest, getStripe, stripeSettings } from '@/lib/stripe';
import { markOrderPaid, markOrderFailed } from '@/lib/orderPayments';
import { getOrderDownloads } from '@/lib/downloadAccess';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/stripe/order-status?order=<orderNumber>&session_id=<cs_...>
// Used by the "thank you" page the customer lands on after paying. The webhook normally has already marked the order paid; if it
// is a few seconds late, this asks Stripe directly (never trusting the address bar) and finishes the order itself. Downloads are
// only returned for a paid order, and only to someone who knows BOTH the order number and Stripe's secret session id.

const hits = new Map();
function tooMany(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 60;
}

async function paidPayload(order) {
  return {
    success: true,
    status: 'paid',
    orderNumber: order.orderNumber,
    total: Number(order.total),
    items: order.items.map((i) => ({ title: i.title, isBundle: !!i.bundleId, quantity: i.quantity })),
    downloads: await getOrderDownloads(order.id),
  };
}

export async function GET(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (tooMany(ip)) return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });

    const { searchParams } = new URL(request.url);
    const orderNumber = String(searchParams.get('order') || '').trim().toUpperCase();
    const sessionId = String(searchParams.get('session_id') || '').trim();
    if (!orderNumber || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return NextResponse.json({ success: false, status: 'not_found' }, { status: 404 });

    const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
    if (!order || order.stripeSessionId !== sessionId) return NextResponse.json({ success: false, status: 'not_found' }, { status: 404 });

    if (order.paymentStatus === 'PAID') return NextResponse.json(await paidPayload(order));
    if (order.paymentStatus === 'FAILED' || order.status === 'CANCELLED') return NextResponse.json({ success: true, status: 'failed' });
    if (order.paymentStatus === 'REFUNDED') return NextResponse.json({ success: true, status: 'refunded' });

    // Still pending: ask Stripe
    const brand = brandFromRequest(request);
    if (!stripeSettings(brand).configured) return NextResponse.json({ success: true, status: 'pending' });
    const session = await getStripe(brand).checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id && session.client_reference_id !== order.id) return NextResponse.json({ success: false, status: 'not_found' }, { status: 404 });

    if (session.payment_status === 'paid') {
      const r = await markOrderPaid(order.id, {
        sessionId: session.id,
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
        amountTotalCents: session.amount_total,
        taxCents: session.total_details?.amount_tax || 0,
        paymentMethodTypes: session.payment_method_types,
      });
      if (r.ok) return NextResponse.json(await paidPayload(r.order));
      return NextResponse.json({ success: true, status: 'review' }); // amount did not match: the shop owner must look at it
    }
    if (session.status === 'expired') {
      await markOrderFailed(order.id);
      return NextResponse.json({ success: true, status: 'failed' });
    }
    return NextResponse.json({ success: true, status: 'pending' });
  } catch (err) {
    console.error('order-status error:', String(err?.message || err).slice(0, 200));
    return NextResponse.json({ success: false, status: 'error' }, { status: 500 });
  }
}
