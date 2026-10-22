// Bundle pricing helpers. No imports, so they work in the browser, in server components and in route handlers.

// What one copy of a product costs today: 0 if free, the sale price when it is set and lower, otherwise the regular price.
export function unitPrice(p) {
  if (!p || p.isFree) return 0;
  const price = Number(p.price) || 0;
  const sale = Number(p.salePrice) || 0;
  return sale > 0 && sale < price ? sale : price;
}

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// regularTotal = what the products would cost bought one by one; savings is never negative.
export function bundleTotals(items, bundlePrice) {
  const regularTotal = round2((items || []).reduce((s, p) => s + unitPrice(p), 0));
  const price = round2(bundlePrice);
  const savings = Math.max(0, round2(regularTotal - price));
  const percentOff = regularTotal > 0 ? Math.round((savings / regularTotal) * 100) : 0;
  return { regularTotal, price, savings, percentOff };
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
