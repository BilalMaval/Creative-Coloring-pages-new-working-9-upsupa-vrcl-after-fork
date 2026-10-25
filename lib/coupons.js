// Coupon logic (server-only). Tables: coupons, coupon_redemptions (see supabase-coupons-migration.sql).
// All money is recomputed here from the database, never trusted from the browser.
import prisma from '@/lib/prisma';
import { ZONE_IDS, DEFAULT_START_ZONE, DEFAULT_END_ZONE, DEFAULT_START_TIME, DEFAULT_END_TIME, zonedToUtcIso } from '@/lib/timezones';

export const normalizeCode = (c) => String(c || '').trim().toUpperCase().replace(/\s+/g, '');
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const COUPON_COLUMNS = `id, code, description, discount_type, discount_value::float8 AS discount_value,
  min_order_amount::float8 AS min_order_amount, max_discount_amount::float8 AS max_discount_amount,
  starts_at, expires_at, start_timezone, end_timezone, usage_limit, per_customer_limit, used_count, is_active, created_at, updated_at`;

export function isMissingTable(err) {
  const m = `${err?.message || ''} ${err?.meta?.message || ''}`;
  return /relation "?(public\.)?coupon/i.test(m) || /coupons?"? does not exist/i.test(m);
}

// Price the cart from the database: sale price when set, otherwise regular price, 0 if free.
// Items are { productId, quantity } or { bundleId, quantity }. A bundle costs its fixed bundle price.
export async function priceItems(items) {
  const wanted = (Array.isArray(items) ? items : []).filter((i) => i && (i.productId || i.bundleId));
  if (wanted.length === 0) throw new Error('Your cart is empty');

  const productIds = [...new Set(wanted.filter((i) => i.productId).map((i) => String(i.productId)))];
  const bundleIds = [...new Set(wanted.filter((i) => i.bundleId).map((i) => String(i.bundleId)))];

  const [products, bundles] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds }, isActive: true }, select: { id: true, title: true, price: true, isFree: true, customFields: true } })
      : [],
    bundleIds.length
      ? prisma.bundle.findMany({
          where: { id: { in: bundleIds }, isActive: true },
          select: { id: true, title: true, price: true, items: { select: { productId: true, product: { select: { isActive: true } } } } },
        })
      : [],
  ]);
  const productById = new Map(products.map((p) => [p.id, p]));
  const bundleById = new Map(bundles.map((b) => [b.id, b]));

  const lines = wanted.map((i) => {
    const quantity = Math.min(Math.max(parseInt(i.quantity, 10) || 1, 1), 99);
    if (i.bundleId) {
      const b = bundleById.get(String(i.bundleId));
      if (!b || !b.items.some((it) => it.product?.isActive)) throw new Error('A bundle in your cart is no longer available');
      return { productId: null, bundleId: b.id, itemType: 'BUNDLE', title: b.title, price: round2(Number(b.price)), quantity };
    }
    const p = productById.get(String(i.productId));
    if (!p) throw new Error('One of the items in your cart is no longer available');
    const sale = Number(p.customFields?.salePrice);
    const regular = Number(p.price);
    const unit = p.isFree ? 0 : (sale > 0 && sale < regular ? sale : regular);
    return { productId: p.id, bundleId: null, itemType: 'PRODUCT', title: p.title, price: round2(unit), quantity };
  });
  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.quantity, 0));
  return { lines, subtotal };
}

export async function findCoupon(code) {
  const c = normalizeCode(code);
  if (!c) return null;
  const rows = await prisma.$queryRawUnsafe(`SELECT ${COUPON_COLUMNS} FROM coupons WHERE upper(code) = $1 LIMIT 1`, c);
  return rows[0] || null;
}

// Returns { ok:true, discount, total, coupon } or { ok:false, error }
export async function evaluateCoupon(code, subtotal, email) {
  let coupon;
  try {
    coupon = await findCoupon(code);
  } catch (err) {
    if (isMissingTable(err)) return { ok: false, error: 'Coupons are not available yet' };
    throw err;
  }
  // Same message for unknown and disabled codes so they cannot be probed
  if (!coupon || !coupon.is_active) return { ok: false, error: 'Invalid coupon code' };
  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return { ok: false, error: 'This coupon is not active yet' };
  if (coupon.expires_at && new Date(coupon.expires_at) < now) return { ok: false, error: 'This coupon has expired' };
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) return { ok: false, error: 'This coupon has reached its usage limit' };
  if (subtotal <= 0) return { ok: false, error: 'Coupons apply to paid items only' };
  if (coupon.min_order_amount > 0 && subtotal < coupon.min_order_amount) {
    return { ok: false, error: `Minimum order of $${coupon.min_order_amount.toFixed(2)} required for this coupon` };
  }
  if (coupon.per_customer_limit != null && email) {
    const r = await prisma.$queryRawUnsafe(
      'SELECT count(*)::int AS n FROM coupon_redemptions WHERE coupon_id = $1::uuid AND lower(email) = lower($2)',
      coupon.id, email
    );
    if ((r[0]?.n || 0) >= coupon.per_customer_limit) return { ok: false, error: 'You have already used this coupon' };
  }
  let discount = coupon.discount_type === 'PERCENT' ? subtotal * (coupon.discount_value / 100) : coupon.discount_value;
  if (coupon.max_discount_amount > 0) discount = Math.min(discount, coupon.max_discount_amount);
  discount = round2(Math.min(discount, subtotal));
  return {
    ok: true,
    discount,
    total: round2(subtotal - discount),
    coupon: { id: coupon.id, code: coupon.code, description: coupon.description, type: coupon.discount_type, value: coupon.discount_value, expiresAt: coupon.expires_at, endTimezone: coupon.end_timezone || DEFAULT_END_ZONE },
  };
}

// Atomically claim one use. Returns false if the limit was hit by a concurrent order.
export async function claimCoupon(couponId) {
  const n = await prisma.$executeRawUnsafe(
    'UPDATE coupons SET used_count = used_count + 1, updated_at = now() WHERE id = $1::uuid AND is_active = true AND (usage_limit IS NULL OR used_count < usage_limit)',
    couponId
  );
  return n === 1;
}

// For a payment that has already gone through: count the use even if the limit was reached by someone else in the meantime
export async function claimCouponAfterPayment(couponId) {
  await prisma.$executeRawUnsafe('UPDATE coupons SET used_count = used_count + 1, updated_at = now() WHERE id = $1::uuid', couponId);
}

export async function releaseCoupon(couponId) {
  await prisma.$executeRawUnsafe('UPDATE coupons SET used_count = GREATEST(used_count - 1, 0) WHERE id = $1::uuid', couponId);
}

export async function recordRedemption({ couponId, orderId, orderNumber, email, discount }) {
  await prisma.$executeRawUnsafe(
    'INSERT INTO coupon_redemptions (coupon_id, order_id, order_number, email, discount_amount) VALUES ($1::uuid, $2, $3, $4, $5::numeric)',
    couponId, orderId, orderNumber, email, discount
  );
}

// Validates and normalises the admin form. Throws Error(message) on bad input.
export function parseCouponInput(b) {
  const code = normalizeCode(b.code);
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new Error('Code must be 3-32 characters: letters, numbers, - or _');
  const type = b.discountType === 'FIXED' ? 'FIXED' : b.discountType === 'PERCENT' ? 'PERCENT' : null;
  if (!type) throw new Error('Choose a discount type');
  const value = Number(b.discountValue);
  if (!(value > 0)) throw new Error('Discount value must be greater than 0');
  if (type === 'PERCENT' && value > 100) throw new Error('Percentage cannot exceed 100');
  const num = (v, name, { int = false, min = 0 } = {}) => {
    if (v === '' || v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || (int && !Number.isInteger(n))) throw new Error(`${name} is invalid`);
    return n;
  };
  // Start/end arrive as a date + time + named time zone and are converted to UTC here (the server is the source of truth).
  // Falls back to a ready-made ISO moment (older callers).
  const moment = (dateKey, timeKey, zoneKey, isoKey, defaultTime, defaultZone, name) => {
    const zone = ZONE_IDS.includes(b[zoneKey]) ? b[zoneKey] : defaultZone;
    if (b[dateKey]) {
      try { return { iso: zonedToUtcIso(String(b[dateKey]), String(b[timeKey] || defaultTime), zone), zone }; }
      catch { throw new Error(`${name} is not a valid date or time`); }
    }
    if (b[isoKey]) {
      const d = new Date(b[isoKey]);
      if (isNaN(d.getTime())) throw new Error(`${name} is not a valid date`);
      return { iso: d.toISOString(), zone };
    }
    return { iso: null, zone };
  };
  const start = moment('startDate', 'startTime', 'startTimezone', 'startsAt', DEFAULT_START_TIME, DEFAULT_START_ZONE, 'Start date');
  const end = moment('expiresDate', 'expiresTime', 'endTimezone', 'expiresAt', DEFAULT_END_TIME, DEFAULT_END_ZONE, 'Expiry date');
  const startsAt = start.iso;
  const expiresAt = end.iso;
  if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) throw new Error('Expiry must be after the start date');
  return {
    code,
    description: b.description ? String(b.description).slice(0, 200) : null,
    type,
    value,
    minOrder: num(b.minOrderAmount, 'Minimum order') ?? 0,
    maxDiscount: type === 'PERCENT' ? num(b.maxDiscountAmount, 'Maximum discount') : null,
    startsAt,
    expiresAt,
    startTimezone: start.zone,
    endTimezone: end.zone,
    usageLimit: num(b.usageLimit, 'Total usage limit', { int: true, min: 1 }),
    perCustomer: num(b.perCustomerLimit, 'Per-customer limit', { int: true, min: 1 }),
    isActive: b.isActive !== false,
  };
}
