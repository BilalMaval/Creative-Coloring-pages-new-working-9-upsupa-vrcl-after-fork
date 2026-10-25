import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { getBrandByDomain } from '@/config/brands';
import { getStripe, stripeSettings, StripeNotConfigured, toCents } from '@/lib/stripe';
import { markOrderRefunded } from '@/lib/orderPayments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/orders/<id or order number>/refund   body: { amount?: number (dollars; leave out for a full refund) }
// Sends the refund to Stripe. A FULL refund also revokes the customer's downloads (an order only delivers files while it is PAID).
export async function POST(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const order = await prisma.order.findFirst({ where: { OR: [{ id }, { orderNumber: id }] } });
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    if (!order.stripePaymentId || order.paymentStatus !== 'PAID') {
      return NextResponse.json({ success: false, error: 'Only paid Stripe orders can be refunded here' }, { status: 400 });
    }

    const totalCents = toCents(order.total);
    const alreadyCents = Number(order.metadata?.refundedCents || 0);
    const remainingCents = totalCents - alreadyCents;
    let amountCents = null;
    if (body.amount !== undefined && body.amount !== null && body.amount !== '') {
      amountCents = toCents(body.amount);
      if (!Number.isFinite(amountCents) || amountCents <= 0) return NextResponse.json({ success: false, error: 'Enter a valid refund amount' }, { status: 400 });
      if (amountCents > remainingCents) return NextResponse.json({ success: false, error: `At most $${(remainingCents / 100).toFixed(2)} can still be refunded` }, { status: 400 });
    }
    const isFull = amountCents === null || amountCents === remainingCents;

    // Use the Stripe account of the brand the order was placed on
    const brand = getBrandByDomain(order.metadata?.brandDomain || request.headers.get('host') || '');
    if (!stripeSettings(brand).configured) throw new StripeNotConfigured();
    const refund = await getStripe(brand).refunds.create(
      {
        payment_intent: order.stripePaymentId,
        ...(amountCents !== null ? { amount: amountCents } : {}),
        reason: 'requested_by_customer',
        metadata: { orderNumber: order.orderNumber, source: 'admin' },
      },
      // The same click twice (same amount, same state) is the same refund, never two
      { idempotencyKey: `refund-${order.id}-${amountCents ?? 'full'}-${alreadyCents}` }
    );

    await markOrderRefunded(order, { fullyRefunded: isFull, refundedCents: alreadyCents + (refund.amount ?? amountCents ?? remainingCents) });
    return NextResponse.json({ success: true, refunded: (refund.amount ?? amountCents ?? remainingCents) / 100, full: isFull });
  } catch (err) {
    if (err instanceof StripeNotConfigured) return NextResponse.json({ success: false, error: 'Stripe is not configured' }, { status: 503 });
    console.error('Refund error:', err?.type || err?.name, String(err?.message || '').slice(0, 200));
    return NextResponse.json({ success: false, error: err?.raw?.message || 'The refund could not be created' }, { status: 502 });
  }
}
