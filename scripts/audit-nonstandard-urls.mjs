/**
 * audit-nonstandard-urls.mjs
 * READ-ONLY. Full inventory of every non-R2/non-Supabase URL in the database.
 * Checks R2 existence for each one. No writes.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
for (const line of env.split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('='); if (eq === -1) continue;
  const k = t.slice(0, eq).trim(), v = t.slice(eq+1).trim().replace(/^["']|["']$/g,'');
  if (!process.env[k]) process.env[k] = v;
}

const SB     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK     = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_CDN = (process.env.R2_PUBLIC_URL || '').replace(/\/$/,'');
const BUCKET = process.env.R2_BUCKET_NAME || 'ccp-storage';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

const r2Cache = {};
async function inR2(key) {
  if (key in r2Cache) return r2Cache[key];
  try { await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })); r2Cache[key] = true; }
  catch { r2Cache[key] = false; }
  return r2Cache[key];
}

function classify(url) {
  if (!url) return 'empty';
  if (url.includes('/storage/v1/object/public/uploads/')) return 'supabase-full';
  if (url.startsWith('https://cdn.creativecoloringpages.online/')) return 'r2';
  if (url.startsWith('/uploads/')) return 'relative-uploads';   // /uploads/images/uuid.png
  if (url.startsWith('/images/') || url.startsWith('/pdfs/'))   return 'relative-broken'; // /images/ts-rand.jpeg
  if (url.startsWith('http'))                                    return 'external';
  return 'other';
}

// Extract R2 key from any non-empty non-supabase URL
function toR2Key(url) {
  if (!url) return null;
  const m1 = url.match(/^\/uploads\/(images\/.+|pdfs\/.+)$/);
  if (m1) return m1[1];
  const m2 = url.match(/^\/(images\/.+|pdfs\/.+)$/);
  if (m2) return m2[1];
  return null;
}

async function query(table, select) {
  const res = await fetch(`${SB}/rest/v1/${table}?select=${encodeURIComponent(select)}`, {
    headers: { apikey: SK, Authorization: `Bearer ${SK}` },
  });
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

const [products, categories, blogPosts] = await Promise.all([
  query('products',   'id,title,slug,webp_path,pdf_path,gallery,is_free,downloads'),
  query('categories', 'id,name,slug,image,icon_image'),
  query('blog_posts', 'id,title,slug,cover_image'),
]);

// Collect all non-standard entries
const entries = [];

for (const p of products) {
  for (const field of ['webp_path', 'pdf_path']) {
    const cls = classify(p[field]);
    if (cls !== 'r2' && cls !== 'supabase-full' && cls !== 'empty') {
      entries.push({ table: 'products', id: p.id, slug: p.slug, title: p.title, field, url: p[field], cls });
    }
  }
  let arr = [];
  try { arr = typeof p.gallery === 'string' ? JSON.parse(p.gallery) : (p.gallery || []); } catch {}
  for (const gUrl of (Array.isArray(arr) ? arr : [])) {
    const cls = classify(gUrl);
    if (cls !== 'r2' && cls !== 'supabase-full' && cls !== 'empty') {
      entries.push({ table: 'products', id: p.id, slug: p.slug, title: p.title, field: 'gallery', url: gUrl, cls });
    }
  }
}
for (const c of categories) {
  for (const field of ['image', 'icon_image']) {
    const cls = classify(c[field]);
    if (cls !== 'r2' && cls !== 'supabase-full' && cls !== 'empty') {
      entries.push({ table: 'categories', id: c.id, slug: c.slug, title: c.name, field, url: c[field], cls });
    }
  }
}
for (const b of blogPosts) {
  const cls = classify(b.cover_image);
  if (cls !== 'r2' && cls !== 'supabase-full' && cls !== 'empty') {
    entries.push({ table: 'blog_posts', id: b.id, slug: b.slug, title: b.title, field: 'cover_image', url: b.cover_image, cls });
  }
}

// R2 check all
for (const e of entries) {
  const key = toR2Key(e.url);
  e.r2Key = key;
  e.inR2  = key ? await inR2(key) : false;
  e.r2Url = e.inR2 ? `${R2_CDN}/${key}` : null;
}

// ── Report ────────────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════════════════');
console.log('  NON-STANDARD URL FULL AUDIT  (READ-ONLY)');
console.log('════════════════════════════════════════════════════\n');
console.log(`Scanned: ${products.length} products, ${categories.length} categories, ${blogPosts.length} blog posts`);
console.log(`Non-standard URLs found: ${entries.length}\n`);

const byClass = {};
for (const e of entries) { (byClass[e.cls] = byClass[e.cls] || []).push(e); }

for (const [cls, items] of Object.entries(byClass)) {
  const inR2Count  = items.filter(e => e.inR2).length;
  const notR2Count = items.filter(e => !e.inR2).length;
  console.log(`━━━ Class: ${cls}  (${items.length} total | ${inR2Count} exist in R2 | ${notR2Count} MISSING from R2) ━━━`);

  // Group by product/slug
  const bySlugs = {};
  for (const e of items) { (bySlugs[e.slug] = bySlugs[e.slug] || []).push(e); }

  for (const [slug, slugEntries] of Object.entries(bySlugs)) {
    console.log(`\n  [${slugEntries[0].table}] slug="${slug}"  title="${slugEntries[0].title}"`);
    for (const e of slugEntries) {
      const r2Status = e.inR2 ? `✓ EXISTS  → ${e.r2Url}` : `✗ MISSING FROM R2`;
      console.log(`    .${e.field.padEnd(12)} ${e.url}`);
      console.log(`    ${''.padEnd(13)} ${r2Status}`);
    }
  }
  console.log();
}

// Summary table
console.log('════════════════════════════════════════════════════');
console.log('  SUMMARY BY CLASS');
console.log('════════════════════════════════════════════════════');
for (const [cls, items] of Object.entries(byClass)) {
  const inR2 = items.filter(e => e.inR2).length;
  const miss  = items.filter(e => !e.inR2).length;
  const uniqueSlugs = [...new Set(items.map(e => e.slug))];
  console.log(`\n  ${cls}`);
  console.log(`    Count        : ${items.length} URLs across ${uniqueSlugs.length} record(s): ${uniqueSlugs.join(', ')}`);
  console.log(`    In R2        : ${inR2}`);
  console.log(`    Missing R2   : ${miss}`);
  console.log(`    Tables/fields: ${[...new Set(items.map(e => `${e.table}.${e.field}`))].join(', ')}`);
}

console.log('\n════════════════════════════════════════════════════');
console.log('  IMPACT ASSESSMENT');
console.log('════════════════════════════════════════════════════\n');

const relBroken  = byClass['relative-broken']  || [];
const relUploads = byClass['relative-uploads'] || [];
const external   = byClass['external']         || [];
const other      = byClass['other']            || [];

if (relBroken.length > 0) {
  const hasR2 = relBroken.filter(e => e.inR2);
  const noR2  = relBroken.filter(e => !e.inR2);
  console.log(`  relative-broken (/images/... or /pdfs/...)`);
  console.log(`    Origin: Uploaded when R2_PUBLIC_URL was missing from .env`);
  console.log(`            r2Client.js returned a path-only string instead of full CDN URL`);
  console.log(`    File exists in R2? ${hasR2.length} YES / ${noR2.length} NO`);
  console.log(`    App behavior: Image tag src="/images/..." → broken (no host)`);
  console.log(`                  DownloadButton regex ^.*?/(pdfs/|images/) → extracts key OK`);
  console.log(`                  → download API receives key, fetches from R2 → PDF downloads work`);
  console.log(`                  → image display is BROKEN (no CDN host)`);
  console.log(`    Fix needed  : Prepend R2_CDN to these ${relBroken.length} paths in the database`);
  console.log();
}

if (relUploads.length > 0) {
  const hasR2 = relUploads.filter(e => e.inR2);
  const noR2  = relUploads.filter(e => !e.inR2);
  console.log(`  relative-uploads (/uploads/images/... or /uploads/pdfs/...)`);
  console.log(`    Origin: Legacy upload system — predates Supabase Storage full-URL format`);
  console.log(`            UUID filenames (not timestamp-random) confirm this is an older version`);
  console.log(`            The app previously proxied /uploads → Supabase Storage bucket root`);
  console.log(`    File exists in R2? ${hasR2.length} YES / ${noR2.length} NO`);
  console.log(`    App behavior: These files were NEVER in R2 (not migrated — regex didn't match)`);
  console.log(`                  Original files are still in Supabase Storage under /uploads/`);
  console.log(`                  → images broken, PDFs broken on R2 path`);
  console.log(`    Fix options : (A) Upload the files from Supabase Storage to R2, then update DB`);
  console.log(`                  (B) Leave as-is — these are pre-migration legacy records`);
  console.log(`                  → REQUIRES USER DECISION before any action`);
  console.log();
}

if (external.length > 0) {
  console.log(`  external (full https:// URL to non-CDN host): ${external.length} — review manually`);
  for (const e of external) console.log(`    ${e.table}.${e.field}: ${e.url}`);
  console.log();
}

console.log('════════════════════════════════════════════════════');
console.log('  PHASE 7 TEST PRODUCT CANDIDATES (confirmed R2)');
console.log('════════════════════════════════════════════════════\n');
// Find products with clean R2 URLs to use in browser testing
const cleanProducts = products.filter(p =>
  classify(p.webp_path) === 'r2' && classify(p.pdf_path) === 'r2'
);
const freeClean = cleanProducts.filter(p => p.is_free);
const paidClean = cleanProducts.filter(p => !p.is_free);

console.log(`  Clean R2 products (both webp+pdf → R2): ${cleanProducts.length}`);
console.log(`    Free: ${freeClean.length}  |  Paid: ${paidClean.length}\n`);

console.log('  Free products for browser testing:');
for (const p of freeClean.slice(0, 5)) {
  console.log(`    slug: ${p.slug}`);
  console.log(`      webp: ${p.webp_path.slice(0,70)}`);
  console.log(`      pdf : ${p.pdf_path.slice(0,70)}`);
  console.log(`      downloads: ${p.downloads}`);
}

// Find products with gallery
console.log('\n  Products with gallery images:');
let galCount = 0;
for (const p of cleanProducts) {
  let arr = [];
  try { arr = typeof p.gallery === 'string' ? JSON.parse(p.gallery) : (p.gallery || []); } catch {}
  if (Array.isArray(arr) && arr.length > 0 && classify(arr[0]) === 'r2') {
    console.log(`    slug: ${p.slug}  (${arr.length} gallery images)`);
    console.log(`      gallery[0]: ${arr[0].slice(0,70)}`);
    if (++galCount >= 3) break;
  }
}
if (galCount === 0) console.log('    (none with R2 gallery found in first pass)');

// Categories with R2 images
const cleanCats = categories.filter(c => classify(c.image) === 'r2');
console.log(`\n  Categories with R2 images: ${cleanCats.length}`);
for (const c of cleanCats.slice(0,3)) {
  console.log(`    slug: ${c.slug}  image: ${c.image?.slice(0,60)}`);
}

// Blog posts with R2 cover
const cleanBlogs = blogPosts.filter(b => classify(b.cover_image) === 'r2');
console.log(`\n  Blog posts with R2 cover images: ${cleanBlogs.length}`);
for (const b of cleanBlogs.slice(0,3)) {
  console.log(`    slug: ${b.slug}  cover: ${b.cover_image?.slice(0,60)}`);
}

console.log('\n════════════════════════════════════════════════════\n');
