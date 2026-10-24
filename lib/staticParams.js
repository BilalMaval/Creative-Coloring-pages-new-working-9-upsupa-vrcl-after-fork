// Which dynamic pages are built at deploy time (the rest are built on their first visit, then cached like the others).
//
// Why not every page: ~760 products x 2 brands would add many minutes to each build and hit the database hard while
// building. Building the most visited pages up front means the first visitor (often Googlebot) gets a ready page, and
// everything else is generated once on first request and then served from cache for 24 hours.
//
// Every lookup is wrapped: if the database is unreachable during a build, the list is simply empty and the build
// still succeeds (pages are then built on demand instead of failing the whole deploy).
import { supabase } from '@/lib/supabaseClients';

// How many of the most downloaded products to build up front (per brand). Set PREBUILD_PRODUCTS to change it.
const PREBUILD_PRODUCTS = Math.max(0, parseInt(process.env.PREBUILD_PRODUCTS ?? '60', 10) || 0);

async function listSlugs(label, query) {
  try {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({ slug: r.slug })).filter((p) => p.slug);
  } catch (err) {
    console.error(`[staticParams] ${label} unavailable, building on demand instead:`, err.message);
    return [];
  }
}

export function productStaticParams() {
  if (PREBUILD_PRODUCTS === 0) return [];
  return listSlugs(
    'products',
    supabase.from('products').select('slug').eq('is_active', true).order('downloads', { ascending: false }).limit(PREBUILD_PRODUCTS)
  );
}

// Categories (the sub-pages of a collection)
export function categoryStaticParams() {
  return listSlugs('categories', supabase.from('categories').select('slug').eq('is_active', true).not('parent_id', 'is', null).limit(500));
}

// Collections (top-level categories)
export function collectionStaticParams() {
  return listSlugs('collections', supabase.from('categories').select('slug').eq('is_active', true).is('parent_id', null).limit(50));
}

export function bundleStaticParams() {
  return listSlugs('bundles', supabase.from('bundles').select('slug').eq('is_active', true).limit(200));
}
