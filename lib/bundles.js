// Storefront reads for bundles (server-only). Uses the same Supabase data layer as products so pages behave the
// same way (ISR, errors are thrown so a failure is never cached as a 404).
import { supabase } from '@/lib/supabaseClients';
import { bundleTotals } from '@/lib/bundlePricing';

const BUNDLE_SELECT = `
  id, title, slug, description, price, image, tags, is_featured, is_active, created_at, updated_at,
  items:bundle_items(
    order,
    product:product_id(id, title, slug, webp_path, price, is_free, is_active, custom_fields)
  )
`;

function failOnError(error, label) {
  if (error && error.code !== 'PGRST116') throw new Error(`${label}: ${error.message}`);
}

function mapBundle(row) {
  const items = (row.items || [])
    .filter((i) => i.product && i.product.is_active)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((i) => ({
      id: i.product.id,
      title: i.product.title,
      slug: i.product.slug,
      webpPath: i.product.webp_path,
      price: i.product.price ? Number(i.product.price) : 0,
      salePrice: i.product.custom_fields?.salePrice ? Number(i.product.custom_fields.salePrice) : null,
      isFree: i.product.is_free,
    }));
  const totals = bundleTotals(items, row.price);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    price: totals.price,
    image: row.image,
    tags: row.tags || [],
    isFeatured: row.is_featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
    cover: row.image || items[0]?.webpPath || null,
    previewImages: items.map((i) => i.webpPath).filter(Boolean).slice(0, 4),
    ...totals,
  };
}

export async function getActiveBundles({ featuredOnly = false, limit = 100 } = {}) {
  let q = supabase
    .from('bundles')
    .select(BUNDLE_SELECT)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (featuredOnly) q = q.eq('is_featured', true);
  const { data, error } = await q;
  if (error) throw new Error(`getActiveBundles: ${error.message}`);
  return (data || []).map(mapBundle).filter((b) => b.items.length > 0);
}

export async function getBundleBySlug(slug) {
  const { data, error } = await supabase
    .from('bundles')
    .select(BUNDLE_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  failOnError(error, 'getBundleBySlug');
  if (!data) return null;
  const bundle = mapBundle(data);
  return bundle.items.length > 0 ? bundle : null;
}

// Active bundles that include a given product (for the "Also available in a bundle" box on product pages)
export async function getBundlesForProduct(productId, limit = 3) {
  const { data: links, error } = await supabase
    .from('bundle_items')
    .select('bundle_id')
    .eq('product_id', productId);
  if (error) throw new Error(`getBundlesForProduct: ${error.message}`);
  const ids = [...new Set((links || []).map((l) => l.bundle_id))];
  if (ids.length === 0) return [];
  const { data, error: e2 } = await supabase
    .from('bundles')
    .select(BUNDLE_SELECT)
    .in('id', ids)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (e2) throw new Error(`getBundlesForProduct: ${e2.message}`);
  return (data || []).map(mapBundle).filter((b) => b.items.length > 0);
}

// JSON for a <script type="application/ld+json"> tag. "<" is escaped so text like "</script>" can never close the tag early.
export function jsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
