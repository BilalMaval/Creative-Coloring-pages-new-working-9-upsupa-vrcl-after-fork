import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { brandFromRequest, getStripe, stripeSettings } from '@/lib/stripe';
import { findOrderForSession, markOrderPaid, markOrderFailed, markOrderRefunded } from '@/lib/orderPayments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/stripe/webhook
// Stripe calls this when something happens to a payment. It is the ONLY place that turns an order into PAID, and every call must
// carry a signature made with this brand's webhook secret, so nobody can fake a payment by calling the URL themselves.
//
// Answer rules: 400 for a bad signature (Stripe will not retry a forged call usefully), 200 once handled or deliberately ignored,
// 500 for a temporary problem (the database was unreachable), because Stripe then retries automatically for up to 3 days.

const ok = (extra = {}) => NextResponse.json({ received: true, ...extra });

async function paidFromSession(session) {
  const order = await findOrderForSession(session);
  if (!order) { console.error('Stripe webhook: no order for session', session.id); return { handled: false }; }
  const r = await markOrderPaid(order.id, {
    sessionId: session.id,
    paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
    amountTotalCents: session.amount_total,
    taxCents: session.total_details?.amount_tax || 0,
    paymentMethodTypes: session.payment_method_types,
  });
  return { handled: true, ...r };
}

export async function POST(request) {
  const brand = brandFromRequest(request);
  const settings = stripeSettings(brand);
  if (!settings.configured || !settings.webhookSecret) {
    console.error('Stripe webhook called but Stripe is not configured for', brand.id);
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  const rawBody = await request.text(); // the signature covers the exact bytes, so never parse before verifying

  let event;
  try {
    event = getStripe(brand).webhooks.constructEvent(rawBody, signature, settings.webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature check failed:', String(err.message).slice(0, 120));
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const obj = event.data.object;
    switch (event.type) {
      case 'checkout.session.completed':
        // 'paid' for cards and wallets. Delayed methods (bank debits) arrive as 'unpaid' and finish with async_payment_succeeded.
        if (obj.payment_status === 'paid' || obj.payment_status === 'no_payment_required') await paidFromSession(obj);
        break;
      case 'checkout.session.async_payment_succeeded':
        await paidFromSession(obj);
        break;
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const order = await findOrderForSession(obj);
        if (order) await markOrderFailed(order.id);
        break;
      }
      case 'charge.refunded': {
        const paymentIntent = typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent?.id;
        const order = paymentIntent ? await prisma.order.findFirst({ where: { stripePaymentId: paymentIntent } }) : null;
        if (order) await markOrderRefunded(order, { fullyRefunded: obj.refunded === true, refundedCents: obj.amount_refunded });
        break;
      }
      case 'charge.dispute.created': {
        // A chargeback is a decision for the shop owner (answer it in the Stripe Dashboard), so only record it on the order.
        const paymentIntent = typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent?.id;
        const order = paymentIntent ? await prisma.order.findFirst({ where: { stripePaymentId: paymentIntent } }) : null;
        if (order) await prisma.order.update({ where: { id: order.id }, data: { metadata: { ...(order.metadata || {}), dispute: { id: obj.id, reason: obj.reason, amount: obj.amount } } } });
        break;
      }
      default:
        break; // other event types are not needed
    }
    return ok();
  } catch (err) {
    console.error('Stripe webhook handler error:', event.type, String(err.message).slice(0, 200));
    return NextResponse.json({ error: 'Temporary error' }, { status: 500 });
  }
}
