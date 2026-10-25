// Order lifecycle for paid checkouts (server-only).
//
//   quote()            price the cart from the database + check the coupon (writes nothing)
//   persistOrder()     save the order (PENDING for a Stripe payment, or already paid for a free order)
//   markOrderPaid()    PENDING -> PAID/COMPLETED, then deliver: download counters, coupon use, confirmation email
//   markOrderFailed()  payment failed or the Stripe page expired
//   markOrderRefunded() full refund: revokes the downloads (see lib/downloadAccess.js isPaidOrder)
//
// Every transition is safe to run twice. Stripe delivers webhooks "at least once", and the success page also checks the
// payment, so the same order can be finalised from two places at the same moment; only the first one does the work.
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { priceItems, evaluateCoupon, claimCouponAfterPayment, recordRedemption } from '@/lib/coupons';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { toCents, fromCents } from '@/lib/stripe';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// An error whose message is safe to show to the customer
export class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'CheckoutError';
    this.status = status;
  }
}

export const MIN_CHARGE_CENTS = 50; // Stripe cannot charge less than $0.50

export async function quote({ email, items, couponCode }) {
  let priced;
  try {
    priced = await priceItems(items);
  } catch (e) {
    throw new CheckoutError(e.message);
  }
  let discount = 0;
  let coupon = null;
  if (couponCode && String(couponCode).trim()) {
    const r = await evaluateCoupon(couponCode, priced.subtotal, email);
    if (!r.ok) throw new CheckoutError(r.error);
    discount = r.discount;
    coupon = r.coupon;
  }
  const total = round2(priced.subtotal - discount);
  return { lines: priced.lines, subtotal: priced.subtotal, discount, coupon, total };
}

export async function getOrCreateGuestUser(email, name) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: { id: uuidv4(), name, email, password: 'guest-no-password', role: 'CUSTOMER', emailVerified: false },
  });
}

const newOrderNumber = () => `CCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

// Save an order. `paid: false` -> waiting for Stripe. `paid: true` -> a free order that is complete right away.
export async function persistOrder({ brand, email, customerName, q, paid = false }) {
  const user = await getOrCreateGuestUser(email, customerName);
  const orderNumber = newOrderNumber();
  const order = await prisma.order.create({
    data: {
      id: uuidv4(),
      orderNumber,
      userId: user.id,
      amount: q.subtotal,
      total: q.total,
      status: paid ? 'COMPLETED' : 'PENDING',
      paymentStatus: paid ? 'PAID' : 'PENDING',
      paymentMethod: paid ? 'FREE' : 'STRIPE',
      email,
      customerName,
      metadata: {
        brand: brand.id,
        brandDomain: brand.domain,
        currency: 'usd',
        ...(q.coupon ? { coupon: { id: q.coupon.id, code: q.coupon.code, discount: q.discount, subtotal: q.subtotal } } : {}),
      },
      items: {
        create: q.lines.map((l) => ({
          id: uuidv4(),
          productId: l.productId,
          bundleId: l.bundleId,
          itemType: l.itemType,
          title: l.title,
          price: l.price,
          quantity: l.quantity,
        })),
      },
    },
    include: { items: true },
  });
  return order;
}

// Download counters: a purchased bundle counts once for every product inside it
async function countDownloads(items) {
  for (const it of items) {
    if (it.productId) {
      await prisma.product.update({ where: { id: it.productId }, data: { downloads: { increment: it.quantity } } }).catch(() => {});
    }
  }
  const bundleItems = items.filter((i) => i.bundleId);
  if (bundleItems.length) {
    const members = await prisma.bundleItem.findMany({
      where: { bundleId: { in: bundleItems.map((i) => i.bundleId) } },
      select: { bundleId: true, productId: true },
    });
    for (const line of bundleItems) {
      for (const m of members.filter((x) => x.bundleId === line.bundleId)) {
        await prisma.product.update({ where: { id: m.productId }, data: { downloads: { increment: line.quantity } } }).catch(() => {});
      }
    }
  }
}

// Things that happen once, after an order becomes paid. A failure here is logged but never undoes the payment.
async function afterPaid(order) {
  const meta = order.metadata || {};
  try { await countDownloads(order.items); } catch (e) { console.error('afterPaid: download counters failed', e.message); }
  try {
    if (meta.coupon?.id) {
      await claimCouponAfterPayment(meta.coupon.id);
      await recordRedemption({ couponId: meta.coupon.id, orderId: order.id, orderNumber: order.orderNumber, email: order.email, discount: meta.coupon.discount });
    }
  } catch (e) { console.error('afterPaid: coupon redemption failed', e.message); }
  try {
    await sendOrderConfirmationEmail({
      email: order.email,
      orderNumber: order.orderNumber,
      items: order.items.map((i) => ({ title: i.title, price: Number(i.price) })),
      total: Number(order.total),
      brandDomain: meta.brandDomain || null,
    });
  } catch (e) { console.error('afterPaid: confirmation email failed', e.message); }
}

export async function findOrderForSession(session) {
  const id = session.client_reference_id || session.metadata?.orderId;
  if (id) {
    const byId = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (byId) return byId;
  }
  return prisma.order.findFirst({ where: { stripeSessionId: session.id }, include: { items: true } });
}

// `info`: { sessionId, paymentIntentId, amountTotalCents, taxCents, paymentMethodTypes }
export async function markOrderPaid(orderId, info = {}) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.paymentStatus === 'PAID') return { ok: true, changed: false, order };
  if (order.paymentStatus === 'REFUNDED') return { ok: false, reason: 'refunded', order };

  // The amount Stripe actually collected (before any tax Stripe added) must equal what this order was priced at on our server
  if (info.amountTotalCents != null) {
    const collected = info.amountTotalCents - (info.taxCents || 0);
    if (collected !== toCents(order.total)) {
      console.error(`Payment amount mismatch on ${order.orderNumber}: Stripe collected ${collected}, order total ${toCents(order.total)}`);
      await prisma.order.update({
        where: { id: order.id },
        data: { metadata: { ...(order.metadata || {}), paymentIssue: `amount mismatch: Stripe ${collected} vs order ${toCents(order.total)}` } },
      }).catch(() => {});
      return { ok: false, reason: 'amount_mismatch', order };
    }
  }

  const res = await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: { not: 'PAID' } },
    data: {
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      paymentMethod: toCents(order.total) === 0 ? 'FREE' : 'STRIPE',
      ...(info.paymentIntentId ? { stripePaymentId: info.paymentIntentId } : {}),
      ...(info.sessionId ? { stripeSessionId: info.sessionId } : {}),
      ...(info.taxCents ? { tax: fromCents(info.taxCents) } : {}),
      ...(info.paymentMethodTypes?.length ? { metadata: { ...(order.metadata || {}), paymentMethodTypes: info.paymentMethodTypes } } : {}),
    },
  });
  if (res.count === 0) return { ok: true, changed: false, order }; // someone else finalised it a moment ago

  const paid = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
  await afterPaid(paid);
  return { ok: true, changed: true, order: paid };
}

export async function markOrderFailed(orderId) {
  const res = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: 'PENDING' },
    data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
  });
  return { changed: res.count > 0 };
}

// `refundedCents` is the total refunded so far; a full refund revokes the downloads
export async function markOrderRefunded(order, { fullyRefunded, refundedCents }) {
  if (fullyRefunded) {
    const res = await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: { not: 'REFUNDED' } },
      data: { status: 'REFUNDED', paymentStatus: 'REFUNDED', metadata: { ...(order.metadata || {}), refundedCents } },
    });
    return { changed: res.count > 0 };
  }
  await prisma.order.update({ where: { id: order.id }, data: { metadata: { ...(order.metadata || {}), refundedCents } } });
  return { changed: false };
}
