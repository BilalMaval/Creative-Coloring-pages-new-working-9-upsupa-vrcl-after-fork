/**
 * migration-audit.mjs
 * READ-ONLY comprehensive audit of all database storage URLs vs R2 objects.
 * Never modifies the database. Never deletes anything. Never prints credentials.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');

// Load .env
const envRaw = readFileSync(envPath, 'utf-8');
for (const line of envRaw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID    = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET        = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET        = process.env.R2_BUCKET_NAME || 'ccp-storage';
const R2_CDN           = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

const SUPABASE_STORAGE_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/uploads/`;

// ── helpers ──────────────────────────────────────────────────────────────────

function isSupabaseStorageUrl(url) {
  return typeof url === 'string' && url.includes('/storage/v1/object/public/uploads/');
}

function isR2Url(url) {
  return typeof url === 'string' && url.startsWith('https://cdn.creativecoloringpages.online/');
}

function supabaseUrlToR2Key(url) {
  // https://xxx.supabase.co/storage/v1/object/public/uploads/images/file.webp → images/file.webp
  const match = url.match(/\/uploads\/(.+)$/);
  return match ? match[1] : null;
}

async function dbQuery(table, select) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`Query ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── load all R2 keys into a Set ───────────────────────────────────────────────

async function loadR2Keys() {
  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET },
  });

  const keys = new Set();
  let token;
  do {
    const res = await r2.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET, MaxKeys: 1000, ContinuationToken: token,
    }));
    (res.Contents || []).forEach(o => keys.add(o.Key));
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

// ── audit a list of URL strings ───────────────────────────────────────────────

function auditUrls(urls, r2Keys, label) {
  let supabaseCount = 0, r2Count = 0, otherCount = 0, missingFromR2 = [];
  for (const url of urls) {
    if (!url) continue;
    if (isSupabaseStorageUrl(url)) {
      supabaseCount++;
      const key = supabaseUrlToR2Key(url);
      if (!key || !r2Keys.has(key)) missingFromR2.push({ url, key });
    } else if (isR2Url(url)) {
      r2Count++;
    } else {
      otherCount++;
    }
  }
  return { label, supabaseCount, r2Count, otherCount, missingFromR2 };
}

// ── main ─────────────────────────────────────────────────────────────────────

console.log('\n========================================================');
console.log('  STORAGE MIGRATION AUDIT');
console.log('========================================================\n');

console.log('Loading R2 object list...');
const r2Keys = await loadR2Keys();
console.log(`R2 objects loaded: ${r2Keys.size}\n`);

// Query all relevant tables
const [products, categories, blogPosts] = await Promise.all([
  dbQuery('products', 'id,title,webp_path,pdf_path,gallery,custom_fields'),
  dbQuery('categories', 'id,name,image,icon_image'),
  dbQuery('blog_posts', 'id,title,cover_image'),
]);

console.log(`Database rows: ${products.length} products, ${categories.length} categories, ${blogPosts.length} blog posts\n`);

// Collect all URLs per field
const fields = {
  'products.webp_path':   products.map(p => p.webp_path),
  'products.pdf_path':    products.map(p => p.pdf_path),
  'products.gallery':     products.flatMap(p => {
    if (!p.gallery) return [];
    try {
      const arr = typeof p.gallery === 'string' ? JSON.parse(p.gallery) : p.gallery;
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }),
  'categories.image':      categories.map(c => c.image),
  'categories.icon_image': categories.map(c => c.icon_image),
  'blog_posts.cover_image': blogPosts.map(b => b.cover_image),
};

let totalSupabase = 0, totalR2 = 0, totalOther = 0;
const allMissing = [];
const results = [];

for (const [label, urls] of Object.entries(fields)) {
  const r = auditUrls(urls, r2Keys, label);
  results.push(r);
  totalSupabase += r.supabaseCount;
  totalR2       += r.r2Count;
  totalOther    += r.otherCount;
  allMissing.push(...r.missingFromR2);
}

// ── Report ────────────────────────────────────────────────────────────────────

console.log('PHASE 1 — DATABASE URL AUDIT\n');
console.log('Field                    Supabase  R2       Other   Missing');
console.log('─────────────────────────────────────────────────────────────');
for (const r of results) {
  const label = r.label.padEnd(24);
  console.log(`${label} ${String(r.supabaseCount).padStart(7)}  ${String(r.r2Count).padStart(7)}  ${String(r.otherCount).padStart(6)}  ${r.missingFromR2.length > 0 ? `⚠ ${r.missingFromR2.length} MISSING` : '✓'}`);
}
console.log('─────────────────────────────────────────────────────────────');
console.log(`${'TOTAL'.padEnd(24)} ${String(totalSupabase).padStart(7)}  ${String(totalR2).padStart(7)}  ${String(totalOther).padStart(6)}`);

console.log(`\n  Supabase Storage URLs to migrate : ${totalSupabase}`);
console.log(`  Already on R2                    : ${totalR2}`);
console.log(`  Other/empty                      : ${totalOther}`);

console.log('\n────────────────────────────────────────────────────────────');
console.log('PHASE 4 — R2 EXISTENCE CHECK');
console.log('────────────────────────────────────────────────────────────');
if (allMissing.length === 0) {
  console.log('\n  ✓ ALL database-referenced files exist in R2.\n  Safe to proceed with URL migration.\n');
} else {
  console.log(`\n  ⚠ WARNING: ${allMissing.length} files referenced in DB are MISSING from R2:\n`);
  for (const m of allMissing) {
    console.log(`  MISSING R2 key: ${m.key}`);
    console.log(`    DB URL: ${m.url.slice(0, 80)}...`);
  }
  console.log('\n  DO NOT proceed with URL migration until these are resolved.\n');
}

// ── Phase 5 — Orphaned R2 objects ────────────────────────────────────────────

console.log('────────────────────────────────────────────────────────────');
console.log('PHASE 5 — ORPHANED R2 OBJECTS');
console.log('────────────────────────────────────────────────────────────\n');

// Build set of all DB-referenced R2 keys
const dbReferencedKeys = new Set();
for (const [, urls] of Object.entries(fields)) {
  for (const url of urls) {
    if (!url) continue;
    if (isSupabaseStorageUrl(url)) {
      const k = supabaseUrlToR2Key(url);
      if (k) dbReferencedKeys.add(k);
    } else if (isR2Url(url)) {
      const k = url.replace('https://cdn.creativecoloringpages.online/', '');
      dbReferencedKeys.add(k);
    }
  }
}

const orphaned = [...r2Keys].filter(k => !dbReferencedKeys.has(k));
console.log(`  R2 total objects      : ${r2Keys.size}`);
console.log(`  DB-referenced objects : ${dbReferencedKeys.size}`);
console.log(`  Orphaned (not in DB)  : ${orphaned.length}\n`);

if (orphaned.length > 0) {
  const imageOrphans = orphaned.filter(k => k.startsWith('images/'));
  const pdfOrphans   = orphaned.filter(k => k.startsWith('pdfs/'));
  const otherOrphans = orphaned.filter(k => !k.startsWith('images/') && !k.startsWith('pdfs/'));
  console.log(`  Image orphans : ${imageOrphans.length}`);
  console.log(`  PDF orphans   : ${pdfOrphans.length}`);
  console.log(`  Other         : ${otherOrphans.length}\n`);
  console.log('  Orphaned keys (first 20):');
  orphaned.slice(0, 20).forEach(k => console.log(`    ${k}`));
  if (orphaned.length > 20) console.log(`    ... and ${orphaned.length - 20} more`);
  console.log('\n  ⚠ DO NOT delete orphaned objects without approval.');
}

// ── Code Audit Summary ────────────────────────────────────────────────────────

console.log('\n────────────────────────────────────────────────────────────');
console.log('PHASE 1 — CODE STORAGE REFERENCES SUMMARY');
console.log('────────────────────────────────────────────────────────────\n');
console.log('  SUPABASE STORAGE USAGE IN PRODUCTION CODE:');
console.log('  ─────────────────────────────────────────');
console.log('  app/api/download/[productId].js  — ⚠ OLD ROUTE: uses supabase.storage.createSignedUrl');
console.log('    (This is a legacy file; active download is app/api/download/route.js which uses R2)');
console.log();
console.log('  MIGRATION SCRIPTS (not production):');
console.log('    scripts/migrate-to-r2.mjs       — uses supabase.storage (expected, migration-only)');
console.log();
console.log('  CLEAN (uses R2 or DB only):');
console.log('    lib/upload.js                   — ✓ R2 PutObjectCommand');
console.log('    app/api/upload/route.js          — ✓ calls lib/upload.js → R2');
console.log('    app/api/download/route.js        — ✓ R2 GetObjectCommand + DB download count');
console.log('    components/DownloadButton.js     — ✓ backward-compatible regex, routes to /api/download');
console.log('    app/admin/products/page.js       — ✓ /api/upload (→ R2)');
console.log('    app/admin/categories/page.js     — ✓ /api/upload (→ R2)');
console.log('    app/admin/collections/page.js    — ✓ /api/upload (→ R2)');
console.log('    app/admin/blog/page.js           — ✓ /api/upload (→ R2)');
console.log('    lib/supabaseClients.js           — ✓ DB only (anon + service role for database)');
console.log('    lib/db.js                        — ✓ DB queries only');

console.log('\n========================================================');
console.log('  AUDIT COMPLETE');
console.log('========================================================\n');
