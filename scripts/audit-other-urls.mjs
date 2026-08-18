/**
 * audit-other-urls.mjs
 * Investigates the "Other" URL category found in verification —
 * paths like /uploads/images/... that are neither Supabase full URLs nor R2 URLs.
 * READ-ONLY.
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
const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_CDN = (process.env.R2_PUBLIC_URL || '').replace(/\/$/,'');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

async function checkR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME || 'ccp-storage', Key: key }));
    return true;
  } catch { return false; }
}

function classifyUrl(url) {
  if (!url) return 'empty';
  if (url.includes('/storage/v1/object/public/uploads/')) return 'supabase-full';
  if (url.startsWith('https://cdn.creativecoloringpages.online/')) return 'r2';
  if (url.startsWith('/images/') || url.startsWith('/pdfs/')) return 'relative-broken';
  if (url.startsWith('/uploads/')) return 'relative-uploads';
  return 'other';
}

// Extract R2 key from any URL format
function toR2Key(url) {
  if (!url) return null;
  // /uploads/images/file.jpg -> images/file.jpg
  const m1 = url.match(/^\/uploads\/(.+)$/);
  if (m1) return m1[1];
  // /images/file.jpg -> images/file.jpg
  const m2 = url.match(/^\/(images\/|pdfs\/)(.+)$/);
  if (m2) return m2[1] + m2[2];
  // full R2 or Supabase
  const m3 = url.match(/\/(images\/|pdfs\/)([^?]+)/);
  if (m3) return m3[1] + m3[2];
  return null;
}

const [pRes, cRes, bRes] = await Promise.all([
  fetch(`${SB}/rest/v1/products?select=id,title,slug,webp_path,pdf_path,gallery,is_free`, { headers: { apikey: SK, Authorization: `Bearer ${SK}` } }),
  fetch(`${SB}/rest/v1/categories?select=id,name,slug,image,icon_image`, { headers: { apikey: SK, Authorization: `Bearer ${SK}` } }),
  fetch(`${SB}/rest/v1/blog_posts?select=id,title,slug,cover_image`, { headers: { apikey: SK, Authorization: `Bearer ${SK}` } }),
]);
const [products, categories, blogPosts] = await Promise.all([pRes.json(), cRes.json(), bRes.json()]);

const otherUrls = [];

for (const p of products) {
  for (const field of ['webp_path', 'pdf_path']) {
    const url = p[field];
    const cls = classifyUrl(url);
    if (cls === 'relative-uploads' || cls === 'other' || cls === 'relative-broken') {
      otherUrls.push({ table: 'products', id: p.id, slug: p.slug, field, url, cls });
    }
  }
  // gallery
  let arr = [];
  try { arr = typeof p.gallery === 'string' ? JSON.parse(p.gallery) : (p.gallery || []); } catch {}
  for (const gUrl of (Array.isArray(arr) ? arr : [])) {
    const cls = classifyUrl(gUrl);
    if (cls !== 'r2' && cls !== 'empty' && cls !== 'supabase-full') {
      otherUrls.push({ table: 'products', id: p.id, slug: p.slug, field: 'gallery', url: gUrl, cls });
    }
  }
}

console.log('\n=== NON-STANDARD URL AUDIT ===\n');
console.log(`Found ${otherUrls.length} non-R2/non-Supabase URLs in the database.\n`);

// Group by class
const byClass = {};
for (const o of otherUrls) {
  byClass[o.cls] = byClass[o.cls] || [];
  byClass[o.cls].push(o);
}
for (const [cls, items] of Object.entries(byClass)) {
  console.log(`Class: ${cls} (${items.length} URLs)`);
}

console.log('\n--- Sample records ---');
for (const o of otherUrls.slice(0, 10)) {
  const key = toR2Key(o.url);
  const inR2 = key ? await checkR2(key) : false;
  console.log(`\n  [${o.cls}] ${o.table}.${o.field}`);
  console.log(`    slug    : ${o.slug}`);
  console.log(`    url     : ${o.url}`);
  console.log(`    R2 key  : ${key || '(cannot extract)'}`);
  console.log(`    In R2?  : ${inR2 ? '✓ YES' : '✗ NO'}`);
  if (inR2 && key) console.log(`    R2 URL  : ${R2_CDN}/${key}`);
}

// Check if the relative-uploads paths serve from Supabase via the app
if (byClass['relative-uploads']?.length > 0) {
  console.log('\n--- HOW relative-uploads paths work ---');
  console.log('These are paths like /uploads/images/uuid.jfif stored in the DB.');
  console.log('They appear to be from a legacy upload system that stored relative paths.');
  console.log('The app would have needed /uploads to be proxied somewhere to serve these.');
  console.log('These are NOT Supabase storage v1 full URLs — they predate the URL format.');
  console.log('Filenames use UUID format (not timestamp-random), suggesting an older version.');
}
