import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
for (const line of env.split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('='); if (eq === -1) continue;
  const k = t.slice(0, eq).trim(), v = t.slice(eq+1).trim().replace(/^["']|["']$/g,'');
  if (!process.env[k]) process.env[k] = v;
}
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Get sample products for testing
const res = await fetch(`${SB}/rest/v1/products?select=id,title,slug,webp_path,pdf_path,gallery,is_free,downloads&order=created_at.asc&limit=10&is_free=eq.true`, {
  headers: { apikey: SK, Authorization: `Bearer ${SK}` }
});
const rows = await res.json();
console.log('\n=== SAMPLE FREE PRODUCTS (for testing) ===');
for (const r of rows.slice(0,5)) {
  console.log(`slug: ${r.slug}`);
  console.log(`  webp_path: ${r.webp_path?.slice(0,70)}`);
  console.log(`  pdf_path : ${r.pdf_path?.slice(0,70)}`);
  console.log(`  downloads: ${r.downloads}`);
  console.log(`  gallery  : ${r.gallery ? JSON.stringify(r.gallery).slice(0,60) : 'none'}`);
  console.log();
}

// Get a product WITH gallery
const galRes = await fetch(`${SB}/rest/v1/products?select=id,title,slug,gallery&not=gallery.is.null&limit=5`, {
  headers: { apikey: SK, Authorization: `Bearer ${SK}` }
});
const galRows = await galRes.json();
console.log('=== PRODUCTS WITH GALLERY ===');
for (const r of galRows) {
  const g = typeof r.gallery === 'string' ? JSON.parse(r.gallery) : r.gallery;
  if (Array.isArray(g) && g.length > 0) {
    console.log(`slug: ${r.slug}`);
    console.log(`  gallery[0]: ${g[0]?.slice(0,70)}`);
    console.log();
  }
}

// Get categories with images
const catRes = await fetch(`${SB}/rest/v1/categories?select=id,name,slug,image,icon_image&not=image.is.null&limit=5`, {
  headers: { apikey: SK, Authorization: `Bearer ${SK}` }
});
const catRows = await catRes.json();
console.log('=== CATEGORIES WITH IMAGES ===');
for (const r of catRows.slice(0,3)) {
  console.log(`slug: ${r.slug}`);
  console.log(`  image     : ${r.image?.slice(0,70)}`);
  console.log(`  icon_image: ${r.icon_image?.slice(0,70)}`);
  console.log();
}

// Get blog posts
const blogRes = await fetch(`${SB}/rest/v1/blog_posts?select=id,title,slug,cover_image&not=cover_image.is.null&limit=3`, {
  headers: { apikey: SK, Authorization: `Bearer ${SK}` }
});
const blogRows = await blogRes.json();
console.log('=== BLOG POSTS WITH COVER IMAGES ===');
for (const r of blogRows) {
  console.log(`slug: ${r.slug}`);
  console.log(`  cover_image: ${r.cover_image?.slice(0,70)}`);
  console.log();
}
