import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { brandFromRequest, getStripe, stripeSettings, StripeNotConfigured, returnOrigin, toCents } from '@/lib/stripe';
import { quote, persistOrder, markOrderPaid, markOrderFailed, CheckoutError, MIN_CHARGE_CENTS } from '@/lib/orderPayments';
import { getOrderDownloads } from '@/lib/downloadAccess';
import { variantUrl } from '@/lib/images';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/stripe/create-checkout   body: { email, customerName, items: [{productId|bundleId, quantity}], couponCode? }
//
// The browser only says WHAT is in the cart. Every price, the coupon and the total are worked out here from the database, so
// nothing the browser sends can lower the amount. Paid orders are saved as PENDING and the customer is sent to Stripe's hosted
// payment page; the order only becomes PAID when Stripe's signed webhook says so (app/api/stripe/webhook/route.js).
// A total of $0 (free items, or a 100% coupon) needs no payment and completes immediately.

const hits = new Map();
function tooMany(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 10;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const fail = (error, status = 400, extra = {}) => NextResponse.json({ success: false, error, ...extra }, { status });

// Product / bundle pictures for Stripe's payment page (small thumbnails on the public CDN)
async function lineImages(lines) {
  const productIds = lines.filter((l) => l.productId).map((l) => l.productId);
  const bundleIds = lines.filter((l) => l.bundleId).map((l) => l.bundleId);
  const [products, bundles] = await Promise.all([
    productIds.length ? prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, webpPath: true } }) : [],
    bundleIds.length ? prisma.bundle.findMany({ where: { id: { in: bundleIds } }, select: { id: true, image: true, items: { take: 1, orderBy: { order: 'asc' }, select: { product: { select: { webpPath: true } } } } } }) : [],
  ]);
  const map = new Map();
  products.forEach((p) => p.webpPath && map.set(p.id, p.webpPath));
  bundles.forEach((b) => { const img = b.image || b.items[0]?.product?.webpPath; if (img) map.set(b.id, img); });
  return (line) => {
    const raw = map.get(line.productId || line.bundleId);
    const url = raw ? variantUrl(raw, 'thumb') : null;
    return url && /^https:\/\//.test(url) && url.length < 2000 ? [url] : undefined;
  };
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (tooMany(ip)) return fail('Too many attempts. Please wait a minute and try again.', 429);

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const customerName = String(body.customerName || '').trim();
    const items = body.items;
    const couponCode = body.couponCode ? String(body.couponCode).slice(0, 40) : '';
    if (!EMAIL.test(email) || email.length > 254) return fail('Please enter a valid email address.');
    if (!customerName || customerName.length > 100) return fail('Please enter your name.');
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) return fail('Your cart is empty.');

    const brand = brandFromRequest(request);
    const q = await quote({ email, items, couponCode });
    const totalCents = toCents(q.total);

    // ── Nothing to pay: complete the order straight away ─────────────────────────────────────────────
    if (totalCents === 0) {
      const order = await persistOrder({ brand, email, customerName, q });
      const done = await markOrderPaid(order.id, { amountTotalCents: 0 });
      if (!done.ok) return fail('Could not complete your order. Please try again.', 500);
      return NextResponse.json({ success: true, free: true, orderNumber: order.orderNumber, downloads: await getOrderDownloads(order.id) });
    }

    // ── A payment is needed ───────────────────────────────────────────────────────────────────────────
    if (totalCents < MIN_CHARGE_CENTS) return fail('The order total must be at least $0.50 for card payment. Add another item or remove the coupon.');
    const settings = stripeSettings(brand);
    if (!settings.configured) return fail('Payments are not available right now. Please try again later.', 503);
    const stripe = getStripe(brand);

    const order = await persistOrder({ brand, email, customerName, q });
    try {
      const imageFor = await lineImages(q.lines);
      const paidLines = q.lines.filter((l) => l.price > 0);
      const line_items = paidLines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: toCents(l.price),
          product_data: { name: l.title.slice(0, 250), images: imageFor(l), ...(process.env.STRIPE_AUTOMATIC_TAX === 'true' ? { tax_code: process.env.STRIPE_TAX_CODE || 'txcd_10000000' } : {}) },
          ...(process.env.STRIPE_AUTOMATIC_TAX === 'true' ? { tax_behavior: process.env.STRIPE_TAX_BEHAVIOR || 'exclusive' } : {}),
        },
      }));

      // Our own coupon becomes a one-time Stripe discount, so Stripe's page and receipt show the saving
      let discounts;
      if (q.discount > 0) {
        const sc = await stripe.coupons.create(
          { amount_off: toCents(q.discount), currency: 'usd', duration: 'once', max_redemptions: 1, name: `Coupon ${q.coupon.code}`.slice(0, 40), metadata: { orderNumber: order.orderNumber } },
          { idempotencyKey: `coupon-${order.id}` }
        );
        discounts = [{ coupon: sc.id }];
      }

      const origin = returnOrigin(request, brand);
      const meta = { orderId: order.id, orderNumber: order.orderNumber, brand: brand.id };
      const session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',
          line_items,
          ...(discounts ? { discounts } : {}),
          customer_email: email,
          client_reference_id: order.id,
          metadata: meta,
          payment_intent_data: { description: `Order ${order.orderNumber} - ${brand.name}`, metadata: meta },
          success_url: `${origin}/checkout/success?order=${encodeURIComponent(order.orderNumber)}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/checkout?canceled=1`,
          expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
          billing_address_collection: 'auto',
          submit_type: 'pay',
          ...(process.env.STRIPE_AUTOMATIC_TAX === 'true' ? { automatic_tax: { enabled: true } } : {}),
        },
        { idempotencyKey: `session-${order.id}` }
      );
      await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
      return NextResponse.json({ success: true, url: session.url, orderNumber: order.orderNumber });
    } catch (err) {
      await markOrderFailed(order.id);
      console.error('Stripe checkout session failed:', err?.type || err?.name, err?.code || '', String(err?.message || '').slice(0, 200));
      return fail('We could not start the payment. Please try again in a moment.', 502);
    }
  } catch (err) {
    if (err instanceof CheckoutError) return fail(err.message, err.status);
    if (err instanceof StripeNotConfigured) return fail('Payments are not available right now. Please try again later.', 503);
    console.error('create-checkout error:', err);
    return fail('Something went wrong. Please try again.', 500);
  }
}
