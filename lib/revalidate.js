// On-demand cache refresh (server-only).
//
// Public pages are cached for 24 hours (ISR). Every admin change calls one of these helpers so the pages that show the
// changed data are rebuilt on their next visit, i.e. edits still appear immediately even though the normal lifetime is
// long.
//
// Two kinds of refresh are used, and the difference matters:
//  - A CONCRETE URL (refresh): "/product/some-slug". Next.js must be called WITHOUT a type for these. (Passing a type
//    makes it look for a tag that does not exist, and nothing is refreshed.) Both the visitor-facing URL and the
//    brand-internal URL it is rewritten to (/ccp/...) are refreshed.
//  - A ROUTE PATTERN (refreshPattern): "/[brand]/product/[slug]" with type 'page', meaning every page of that kind.
//    Used only for rare structural changes (renaming or deleting a category / collection), because every page of that
//    kind then rebuilds again on its next visit.
import { revalidatePath } from 'next/cache';
import { getBrandKeys } from '@/config/brands';
import { admin } from '@/lib/supabaseClients';

const CATEGORY_PAGE_SIZE = 48; // must match getProductsByCategory in lib/db.js

function refresh(path) {
  const targets = [path || '/', ...getBrandKeys().map((b) => `/${b}${path}`)];
  for (const target of targets) {
    try {
      revalidatePath(target);
    } catch (err) {
      console.error('revalidatePath failed:', target, err.message);
    }
  }
}

function refreshPattern(pattern) {
  try {
    revalidatePath(`/[brand]${pattern}`, 'page');
  } catch (err) {
    console.error('revalidatePath failed:', pattern, err.message);
  }
}

export const revalidateHome = () => refresh('');

// A category (its first page and every paginated page) and the collection it belongs to
export function revalidateCategoryBySlug(slug, parentSlug, pages = 1) {
  if (slug) {
    refresh(`/category/${slug}`);
    for (let n = 2; n <= pages; n++) refresh(`/category/${slug}/page/${n}`);
  }
  if (parentSlug) refresh(`/collection/${parentSlug}`);
}

// Look up a category's slug, its collection's slug and how many listing pages it has, then refresh all of them
export async function revalidateCategoryById(categoryId) {
  if (!categoryId) return;
  try {
    const [{ data }, { count }] = await Promise.all([
      admin.from('categories').select('slug, parent:parent_id(slug)').eq('id', categoryId).single(),
      admin.from('products').select('id', { count: 'exact', head: true }).eq('category_id', categoryId).eq('is_active', true),
    ]);
    if (data) revalidateCategoryBySlug(data.slug, data.parent?.slug, Math.ceil((count || 0) / CATEGORY_PAGE_SIZE) + 1);
  } catch (err) {
    console.error('revalidateCategoryById failed:', err.message);
    refreshPattern('/category/[slug]');
    refreshPattern('/category/[slug]/page/[page]');
  }
}

// A product changed: its own page, its category listing, its collection, the home page and any bundle that shows it
export async function revalidateProduct({ slug, categoryId } = {}) {
  if (slug) refresh(`/product/${slug}`);
  await revalidateCategoryById(categoryId);
  revalidateHome();
  refreshPattern('/bundle/[slug]');
  refreshPattern('/bundles');
}

// A category or collection was created, renamed, moved or deleted
export async function revalidateStructure({ slug, parentSlug, broad = false } = {}) {
  if (slug) revalidateCategoryBySlug(slug, parentSlug);
  if (slug && !parentSlug) refresh(`/collection/${slug}`);
  revalidateHome();
  if (broad) {
    // Names and breadcrumbs appear on product, category and collection pages
    refreshPattern('/product/[slug]');
    refreshPattern('/category/[slug]');
    refreshPattern('/category/[slug]/page/[page]');
    refreshPattern('/collection/[slug]');
  }
}

export function revalidateBlog(slug) {
  refresh('/blog');
  if (slug) refresh(`/blog/${slug}`);
  revalidateHome();
}

// A review was added or removed: the product page shows the rating and the list
export async function revalidateProductById(productId) {
  if (!productId) return;
  try {
    const { data } = await admin.from('products').select('slug, category_id').eq('id', productId).single();
    if (data) {
      refresh(`/product/${data.slug}`);
      await revalidateCategoryById(data.category_id); // category cards show the star rating
    }
  } catch (err) {
    console.error('revalidateProductById failed:', err.message);
  }
}

export function revalidateAbout() {
  refresh('/about');
}
