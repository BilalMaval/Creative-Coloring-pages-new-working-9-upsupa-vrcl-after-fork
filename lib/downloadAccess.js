// Paid-file protection (server-only).
// A paid file is served only with proof of a paid order: a signed token that the server hands out for one
// (order, product) pair, checked together with the order's real status in the database.
// Free files need no proof. Tokens contain no secrets and cannot be forged without the server secret.
import crypto from 'crypto';
import prisma from '@/lib/prisma';

const secret = () => process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function downloadToken(orderId, productId) {
  return crypto.createHmac('sha256', `ccp-download:${secret()}`).update(`${orderId}:${productId}`).digest('base64url');
}

function tokenMatches(orderId, productId, token) {
  if (!token || typeof token !== 'string') return false;
  const a = Buffer.from(downloadToken(orderId, productId));
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Storage key ("pdfs/abc.pdf") from a stored file address (old Supabase URL or CDN URL)
export const keyFromPath = (p) => String(p || '').replace(/^.*?\/(pdfs\/|images\/)/, '$1');
const extOf = (p) => String(p || '').split('.').pop()?.toLowerCase() || 'pdf';

// An order counts as paid for download purposes when payment is confirmed and it was not cancelled or refunded.
export const isPaidOrder = (o) => o.paymentStatus === 'PAID' && !['CANCELLED', 'REFUNDED'].includes(o.status);

// Does this order entitle the holder to this product (bought directly or inside a bundle)?
export async function orderCoversProduct(order, productId) {
  if (order.items.some((i) => i.productId === productId)) return true;
  const bundleIds = order.items.map((i) => i.bundleId).filter(Boolean);
  if (bundleIds.length === 0) return false;
  const hit = await prisma.bundleItem.findFirst({ where: { productId, bundleId: { in: bundleIds } }, select: { id: true } });
  return !!hit;
}

// Decide whether a download request may proceed.
// Returns { ok:true } or { ok:false, status, error }.
// The file -> product lookup rarely changes, so it is remembered for a minute per server instance.
// (The order check below is never cached: it always reads the order's real status.)
const productByKey = new Map();
const KEY_TTL_MS = 60_000;

async function productForKey(key) {
  const hit = productByKey.get(key);
  if (hit && Date.now() - hit.at < KEY_TTL_MS) return hit.product;
  const product = await prisma.product.findFirst({
    where: { pdfPath: { endsWith: `/${key}` } },
    select: { id: true, isFree: true },
  });
  if (productByKey.size > 2000) productByKey.clear();
  productByKey.set(key, { at: Date.now(), product });
  return product;
}

export async function authorizeDownload({ key, orderNumber, token }) {
  const product = await productForKey(key);

  if (!product) {
    // Not the file of any product: only plain images may be fetched this way; stray documents stay private
    return key.startsWith('images/') ? { ok: true } : { ok: false, status: 404, error: 'File not found' };
  }
  if (product.isFree) return { ok: true, productId: product.id };

  if (!orderNumber || !token) return { ok: false, status: 403, error: 'Purchase required' };
  const order = await prisma.order.findUnique({
    where: { orderNumber: String(orderNumber) },
    select: { id: true, status: true, paymentStatus: true, items: { select: { productId: true, bundleId: true } } },
  });
  if (!order || !isPaidOrder(order) || !tokenMatches(order.id, product.id, token) || !(await orderCoversProduct(order, product.id))) {
    return { ok: false, status: 403, error: 'Purchase required' };
  }
  return { ok: true, productId: product.id };
}

// Every file an order unlocks, each with its proof token, grouped by bundle where relevant.
export async function getOrderDownloads(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, items: { select: { productId: true, bundleId: true, title: true } } },
  });
  if (!order) return [];

  const direct = order.items.filter((i) => i.productId).map((i) => i.productId);
  const bundleIds = order.items.filter((i) => i.bundleId).map((i) => i.bundleId);
  const [products, members] = await Promise.all([
    direct.length ? prisma.product.findMany({ where: { id: { in: direct } }, select: { id: true, title: true, pdfPath: true } }) : [],
    bundleIds.length
      ? prisma.bundleItem.findMany({
          where: { bundleId: { in: bundleIds } },
          orderBy: { order: 'asc' },
          select: { bundleId: true, product: { select: { id: true, title: true, pdfPath: true } } },
        })
      : [],
  ]);

  const entry = (p, bundleId, bundleTitle) => ({
    productId: p.id,
    bundleId,
    bundleTitle,
    title: p.title,
    key: keyFromPath(p.pdfPath),
    ext: extOf(p.pdfPath),
    token: downloadToken(order.id, p.id),
  });
  const bundleTitle = new Map(order.items.filter((i) => i.bundleId).map((i) => [i.bundleId, i.title]));
  return [
    ...products.filter((p) => p.pdfPath).map((p) => entry(p, null, null)),
    ...members.filter((m) => m.product?.pdfPath).map((m) => entry(m.product, m.bundleId, bundleTitle.get(m.bundleId) || 'Bundle')),
  ];
}
