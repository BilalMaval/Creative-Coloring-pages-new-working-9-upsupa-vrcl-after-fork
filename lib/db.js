/**
 * Supabase-backed data access layer — OPTIMISED FOR SPEED
 *
 * Key optimisations applied (vs old version):
 *
 *  1. getCategoryBySlug   — PostgREST nested embedding: category + parent in 1 RT (was 2 sequential)
 *  2. getProductBySlug    — PostgREST nested embedding: product + category + parent in 1 RT,
 *                           then reviews + related in parallel (was 5 sequential RTs → now 2 steps)
 *  3. getProductsByCategory — removed the extra reviews round-trip; products+count run in parallel
 *                             as before, but we no longer add a 3rd sequential call for ratings
 *  4. getCollectionBySlug — children fetched in same step (no change needed, was already 2 RTs
 *                           but they are sequential by necessity — children need collection.id)
 *
 * Supabase PostgREST embedded-resource syntax used:
 *   table:foreign_table!fk_column(cols)
 *   nesting: table!fk(col, parent:same_table!parent_fk(cols))
 */

import { supabase } from './supabaseClients';

// PostgREST code for "no rows" from .single(): a genuine not-found.
// Any other error is a failure and must throw, so ISR never caches it as a 404.
function failOnError(error, label) {
  if (error && error.code !== 'PGRST116') throw new Error(`${label}: ${error.message}`);
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export async function getSettingByKey(key) {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .eq('key', key)
    .single();
  return data || null;
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

export async function getAllActiveCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, parent_id, icon_image, emoji, show_on_homepage, homepage_order, image, updated_at')
    .eq('is_active', true)
    .order('homepage_order', { ascending: true })
    .order('order', { ascending: true });

  if (error) throw new Error(`getAllActiveCategories: ${error.message}`);

  return (data || []).map(mapCategory);
}

/**
 * OPTIMISED: was 2 sequential Supabase calls (category, then parent).
 * Now 1 call using PostgREST nested embedding — parent row comes back inside
 * the category row via the `parent_id` foreign-key hint.
 *
 * PostgREST syntax: parent:categories!parent_id(id,name,slug)
 *   → embed the `categories` table (self-join) via the `parent_id` FK column,
 *     alias the embedded object as "parent".
 */
export async function getCategoryBySlug(slug) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, image, parent_id, parent:parent_id(id, name, slug)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  failOnError(error, 'getCategoryBySlug');
  if (!data) return null;

  const parent = data.parent || null;

  return {
    ...mapCategory(data),
    parent,
  };
}

/**
 * Collections are root-level categories (parent_id IS NULL).
 * children are fetched in a second call — unavoidable since we need the
 * collection's id first. Still faster than the old version because
 * getCategoryBySlug no longer does 2 sequential calls internally.
 */
export async function getCollectionBySlug(slug) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, image')
    .eq('slug', slug)
    .is('parent_id', null)
    .eq('is_active', true)
    .single();

  failOnError(error, 'getCollectionBySlug');
  if (!data) return null;

  // Fetch children (subcategories) — depends on data.id, must be sequential
  const { data: children } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon_image, emoji')
    .eq('parent_id', data.id)
    .eq('is_active', true)
    .order('homepage_order', { ascending: true })
    .order('order', { ascending: true });

  return {
    collection: {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      coverImage: data.image,
    },
    categories: (children || []).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      iconImage: c.icon_image,
      emoji: c.emoji,
    })),
  };
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

// Newest and most-downloaded active products for the homepage (direct links to deep pages).
export async function getHomeProducts(limit = 12) {
  const cols = 'id, title, slug, webp_path, is_free, price, downloads, custom_fields';
  const [latest, popular] = await Promise.all([
    supabase.from('products').select(cols).eq('is_active', true).order('created_at', { ascending: false }).limit(limit),
    supabase.from('products').select(cols).eq('is_active', true).order('downloads', { ascending: false }).limit(limit),
  ]);
  if (latest.error) throw new Error(`getHomeProducts(latest): ${latest.error.message}`);
  if (popular.error) throw new Error(`getHomeProducts(popular): ${popular.error.message}`);
  const map = (p) => ({
    id: p.id, title: p.title, slug: p.slug, webpPath: p.webp_path, isFree: p.is_free,
    price: p.price ? Number(p.price) : 0,
    salePrice: p.custom_fields?.salePrice ? Number(p.custom_fields.salePrice) : null,
  });
  return { latest: (latest.data || []).map(map), popular: (popular.data || []).map(map) };
}

// Number of active products directly in the given categories (used to noindex empty pages).
export async function countActiveProducts(categoryIds) {
  if (!categoryIds.length) return 0;
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .in('category_id', categoryIds)
    .eq('is_active', true);
  if (error) throw new Error(`countActiveProducts: ${error.message}`);
  return count || 0;
}

const PRODUCT_LIST_SELECT =
  'id, title, slug, webp_path, is_free, is_featured, price, downloads, category_id, custom_fields';

/**
 * OPTIMISED: was 3 calls (products + count in parallel, then reviews sequential).
 * Reviews query removed from category listings — avoids a 3rd round-trip.
 * Products and the total count still run in parallel via Promise.all.
 *
 * Note: star ratings are still shown on the product detail page (where we DO
 * fetch reviews). On the listing grid cards, averageRating/reviewCount are
 * omitted; the card component gracefully hides stars when reviewCount === 0.
 */
export async function getProductsByCategory(categoryId, page = 1, pageSize = 48) {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  const [{ data: products, error }, { count }] = await Promise.all([
    supabase
      .from('products')
      .select(PRODUCT_LIST_SELECT)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at',  { ascending: false })
      .range(from, to),

    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('is_active', true),
  ]);

  if (error) throw new Error(`getProductsByCategory: ${error.message}`);

  const mapped = (products || []).map(p => ({
    id:          p.id,
    title:       p.title,
    slug:        p.slug,
    webpPath:    p.webp_path,
    isFree:      p.is_free,
    isFeatured:  p.is_featured,
    price:       p.price ? Number(p.price) : 0,
    salePrice:   p.custom_fields?.salePrice ? Number(p.custom_fields.salePrice) : null,
    downloads:   p.downloads,
    // Ratings skipped on listing pages — saves 1 round trip per page load
    averageRating: 0,
    reviewCount:   0,
  }));

  return { products: mapped, totalCount: count || 0 };
}

/**
 * OPTIMISED: was 5 sequential Supabase calls.
 *
 * Old waterfall:
 *   1. fetch product
 *   2. fetch category  (depends on product.category_id)
 *   3. fetch parent    (depends on category.parent_id)
 *   4. fetch reviews   (depends on product.id)
 *   5. fetch related   (depends on product.category_id)
 *
 * New 2-step approach:
 *   Step A (1 RT): fetch product WITH nested category + parent in one PostgREST query
 *   Step B (2 RTs in parallel): fetch reviews + fetch related simultaneously
 *
 * PostgREST nested embedding syntax used:
 *   category:categories!category_id(id, name, slug, parent:categories!parent_id(id, name, slug))
 *
 *   → products.category_id  references categories.id    (alias: "category")
 *   → categories.parent_id  references categories.id    (alias: "parent", self-join)
 */
export async function getProductBySlug(slug) {
  // ── Step A: product + category + grandparent in ONE query ──────────────────
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, title, slug, description, webp_path, pdf_path, price, is_free, is_featured,
      downloads, views, created_at, category_id, custom_fields, gallery,
      print_length, language, dimensions,
      category:category_id(
        id, name, slug,
        parent:parent_id(id, name, slug)
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  failOnError(error, 'getProductBySlug');
  if (!data) return null;

  // ── Step B: reviews + related products in PARALLEL ─────────────────────────
  const [{ data: reviews }, { data: related }] = await Promise.all([
    supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', data.id)
      .eq('is_approved', true),

    supabase
      .from('products')
      .select(PRODUCT_LIST_SELECT)
      .eq('category_id', data.category_id)
      .eq('is_active', true)
      .neq('id', data.id)
      .order('downloads', { ascending: false })
      .limit(6),
  ]);

  // Increment views in background (fire-and-forget, does NOT block the response)
  supabase
    .from('products')
    .update({ views: (data.views || 0) + 1 })
    .eq('id', data.id)
    .then(() => {});

  // Compute ratings
  const ratings = (reviews || []).map(r => r.rating);
  const avg = ratings.length > 0
    ? ratings.reduce((s, r) => s + r, 0) / ratings.length
    : 0;

  // Build the nested category object (PostgREST returns it as data.category)
  const cat = data.category;
  const categoryWithParent = cat
    ? { id: cat.id, name: cat.name, slug: cat.slug, parent: cat.parent || null }
    : null;

  const relatedMapped = (related || []).map(p => ({
    id:       p.id,
    title:    p.title,
    slug:     p.slug,
    webpPath: p.webp_path,
    isFree:    p.is_free,
    price:     p.price ? Number(p.price) : 0,
    salePrice: p.custom_fields?.salePrice ? Number(p.custom_fields.salePrice) : null,
  }));

  return {
    product: {
      id:            data.id,
      title:         data.title,
      slug:          data.slug,
      description:   data.description,
      webpPath:      data.webp_path,
      pdfPath:       data.pdf_path,
      price:         data.price ? Number(data.price) : 0,
      salePrice:     data.custom_fields?.salePrice ? Number(data.custom_fields.salePrice) : null,
      isFree:        data.is_free,
      isFeatured:    data.is_featured,
      downloads:     data.downloads,
      views:         data.views,
      createdAt:     data.created_at,
      categoryId:    data.category_id,
      customFields:  data.custom_fields,
      gallery:       data.gallery || [],
      printLength:   data.print_length,
      language:      data.language,
      dimensions:    data.dimensions,
      category:      categoryWithParent,
      averageRating: Math.round(avg * 10) / 10,
      reviewCount:   ratings.length,
    },
    relatedProducts: relatedMapped,
  };
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

export async function getPageBySlug(slug) {
  const { data } = await supabase
    .from('pages')
    .select('id, slug, title, body')
    .eq('slug', slug)
    .single();
  return data || null;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function mapCategory(c) {
  return {
    id:            c.id,
    name:          c.name,
    slug:          c.slug,
    description:   c.description,
    parentId:      c.parent_id,
    iconImage:     c.icon_image,
    emoji:         c.emoji,
    showOnHomepage: c.show_on_homepage,
    homepageOrder: c.homepage_order,
    image:         c.image,
    updatedAt:     c.updated_at,
  };
}
