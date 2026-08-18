/**
 * phase8-migrate-legacy.mjs
 *
 * Phase 8A: Fix the "testing" product (relative /images/ and /pdfs/ paths).
 *           Files already exist in R2 — only a DB update needed.
 *
 * Phase 8B: Migrate the three legacy /uploads/ products (edu-book, kids-colours,
 *           kids-colours-T-1). Files are in Supabase Storage, not in R2.
 *           Copies each file from Supabase Storage → R2, then updates DB.
 *
 * Usage:
 *   node scripts/phase8-migrate-legacy.mjs --dry-run     (default — no writes)
 *   node scripts/phase8-migrate-legacy.mjs --execute     (after approval)
 *
 * Safety:
 *   - Dry-run by default: requires --execute flag to write anything
 *   - Verifies each R2 object exists before updating DB
 *   - Never deletes Supabase Storage files
 *   - Never drops DB records
 *   - Idempotent: already-correct values are skipped
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
for (const line of env.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const SB     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK     = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_CDN = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
const BUCKET = process.env.R2_BUCKET_NAME || 'ccp-storage';
const DRY_RUN = !process.argv.includes('--execute');

if (!SB || !SK || !R2_CDN) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, R2_PUBLIC_URL');
  process.exit(1);
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// ── helpers ────────────────────────────────────────────────────────────────────

async function r2Exists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch { return false; }
}

async function r2Head(key) {
  try {
    const res = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return { exists: true, size: res.ContentLength, type: res.ContentType };
  } catch { return { exists: false }; }
}

async function supabaseStorageHead(storagePath) {
  // HEAD the Supabase Storage object via the public URL to check existence + size
  const url = `${SB}/storage/v1/object/public/uploads/${storagePath}`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return { exists: res.ok, size: parseInt(res.headers.get('content-length') || '0'), type: res.headers.get('content-type') || '' };
  } catch { return { exists: false }; }
}

async function supabaseStorageDownload(storagePath) {
  const url = `${SB}/storage/v1/object/public/uploads/${storagePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${storagePath}: HTTP ${res.status}`);
  return { buffer: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') || 'application/octet-stream' };
}

async function copyToR2(sourceStoragePath, r2Key, mimeType, buffer) {
  await r2.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         r2Key,
    Body:        buffer,
    ContentType: mimeType,
  }));
}

async function dbQuery(table, select, filter = '') {
  const res = await fetch(`${SB}/rest/v1/${table}?select=${encodeURIComponent(select)}${filter}`, {
    headers: { apikey: SK, Authorization: `Bearer ${SK}` },
  });
  if (!res.ok) throw new Error(`GET ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function dbPatch(table, id, patch) {
  const res = await fetch(`${SB}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SK,
      Authorization: `Bearer ${SK}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`PATCH ${table} id=${id}: ${res.status} ${await res.text()}`);
}

// ── Phase 8A: "testing" product fix ──────────────────────────────────────────

async function phase8A() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  PHASE 8A — Fix "testing" product (relative paths → R2)');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : '⚡ EXECUTE'}`);
  console.log('════════════════════════════════════════════════════════\n');

  const rows = await dbQuery('products', 'id,slug,webp_path,pdf_path,gallery', '&slug=eq.testing');
  if (!rows.length) { console.log('  ✗ Product "testing" not found in DB'); return []; }
  const p = rows[0];

  console.log(`  Product id   : ${p.id}`);
  console.log(`  Current paths:`);
  console.log(`    webp_path : ${p.webp_path}`);
  console.log(`    pdf_path  : ${p.pdf_path}`);
  let gallery = [];
  try { gallery = typeof p.gallery === 'string' ? JSON.parse(p.gallery) : (p.gallery || []); } catch {}
  for (let i = 0; i < gallery.length; i++) console.log(`    gallery[${i}]: ${gallery[i]}`);

  // Build the expected R2 keys by stripping the leading slash
  // /images/1786899076543-knck0d.jpeg  →  images/1786899076543-knck0d.jpeg
  const fields = [
    { field: 'webp_path', current: p.webp_path },
    { field: 'pdf_path',  current: p.pdf_path  },
    ...gallery.map((url, i) => ({ field: `gallery[${i}]`, current: url, galleryIdx: i })),
  ];

  const actions = [];
  let allR2Confirmed = true;

  console.log('\n  Verification:');
  for (const f of fields) {
    const key = f.current?.replace(/^\//, ''); // strip leading /
    if (!key) { console.log(`    ${f.field}: empty — skip`); continue; }
    const newUrl = `${R2_CDN}/${key}`;
    const alreadyR2 = f.current?.startsWith(R2_CDN);
    if (alreadyR2) { console.log(`    ${f.field}: already R2 — skip`); continue; }

    const head = await r2Head(key);
    const status = head.exists ? `✓ EXISTS (${(head.size/1024).toFixed(1)} KB, ${head.type})` : '✗ MISSING FROM R2';
    console.log(`    ${f.field}`);
    console.log(`      R2 key : ${key}`);
    console.log(`      R2     : ${status}`);
    console.log(`      New URL: ${newUrl}`);

    if (!head.exists) { allR2Confirmed = false; }
    actions.push({ ...f, key, newUrl, r2Exists: head.exists });
  }

  if (!allR2Confirmed) {
    console.log('\n  ✗ Cannot proceed — some R2 objects are missing. Aborting Phase 8A.');
    return [];
  }

  // Build DB patch
  const patch = {};
  let newGallery = [...gallery];
  for (const a of actions) {
    if (a.field === 'webp_path') patch.webp_path = a.newUrl;
    else if (a.field === 'pdf_path') patch.pdf_path = a.newUrl;
    else if (a.galleryIdx !== undefined) newGallery[a.galleryIdx] = a.newUrl;
  }
  const galleryActions = actions.filter(a => a.galleryIdx !== undefined);
  // gallery is a text[] column — send as JS array, not JSON string
  if (galleryActions.length > 0) patch.gallery = newGallery;

  console.log('\n  Proposed DB patch:');
  for (const [k, v] of Object.entries(patch)) {
    const display = k === 'gallery' ? JSON.stringify(v).slice(0, 120) + '…' : v;
    console.log(`    ${k}: ${display}`);
  }

  if (DRY_RUN) {
    console.log('\n  ✅ DRY RUN: No DB changes written.');
  } else {
    console.log('\n  Applying DB update…');
    await dbPatch('products', p.id, patch);
    console.log('  ✅ DONE: "testing" product DB updated.');
  }

  return actions.map(a => ({ phase: '8A', ...a }));
}

// ── Phase 8B: Legacy /uploads/ products ──────────────────────────────────────

const LEGACY_SLUGS = ['edu-book', 'kids-colours', 'kids-colours-T-1'];

async function phase8B() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  PHASE 8B — Migrate legacy /uploads/ products to R2');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : '⚡ EXECUTE'}`);
  console.log('════════════════════════════════════════════════════════\n');

  const placeholders = LEGACY_SLUGS.map((_, i) => `slug=eq.${LEGACY_SLUGS[i]}`).join('&or=(');
  // Use individual queries to avoid complex URL encoding
  const allRows = [];
  for (const slug of LEGACY_SLUGS) {
    const rows = await dbQuery('products', 'id,slug,title,webp_path,pdf_path,gallery', `&slug=eq.${slug}`);
    allRows.push(...rows);
  }

  if (!allRows.length) { console.log('  No legacy products found.'); return []; }

  const allActions = [];
  let totalMissing = 0;

  for (const p of allRows) {
    console.log(`\n  ─── Product: "${p.title}" (slug=${p.slug}) ───`);
    console.log(`  DB id: ${p.id}`);

    let gallery = [];
    try { gallery = typeof p.gallery === 'string' ? JSON.parse(p.gallery) : (p.gallery || []); } catch {}

    const urlFields = [
      { field: 'webp_path', current: p.webp_path },
      { field: 'pdf_path',  current: p.pdf_path  },
      ...gallery.map((url, i) => ({ field: `gallery[${i}]`, current: url, galleryIdx: i })),
    ];

    const productActions = [];

    for (const f of urlFields) {
      const url = f.current;
      if (!url) continue;

      // Only handle /uploads/ paths
      if (!url.startsWith('/uploads/')) {
        console.log(`    ${f.field}: ${url.slice(0,60)} — not a /uploads/ path, skip`);
        continue;
      }

      // /uploads/images/uuid.jfif → storagePath=images/uuid.jfif, r2Key=images/uuid.jfif
      const storagePath = url.replace(/^\/uploads\//, '');  // e.g. images/uuid.jfif
      const r2Key       = storagePath;                        // same path in R2
      const newUrl      = `${R2_CDN}/${r2Key}`;

      // Check Supabase Storage
      const sbHead = await supabaseStorageHead(storagePath);
      // Check R2
      const r2HeadResult = await r2Head(r2Key);

      const sbStatus = sbHead.exists
        ? `✓ EXISTS in Supabase (${(sbHead.size/1024).toFixed(1)} KB, ${sbHead.type})`
        : '✗ MISSING from Supabase Storage';
      const r2Status = r2HeadResult.exists
        ? `✓ ALREADY IN R2 (${(r2HeadResult.size/1024).toFixed(1)} KB)`
        : '✗ NOT YET IN R2';

      console.log(`\n    ${f.field}`);
      console.log(`      Current URL    : ${url}`);
      console.log(`      Storage path   : uploads/${storagePath}`);
      console.log(`      R2 destination : ${r2Key}`);
      console.log(`      Supabase       : ${sbStatus}`);
      console.log(`      R2             : ${r2Status}`);
      console.log(`      New DB URL     : ${newUrl}`);

      if (!sbHead.exists) totalMissing++;

      productActions.push({
        phase: '8B',
        productId: p.id,
        slug: p.slug,
        title: p.title,
        field: f.field,
        galleryIdx: f.galleryIdx,
        currentUrl: url,
        storagePath,
        r2Key,
        newUrl,
        inSupabase: sbHead.exists,
        supabaseSize: sbHead.size,
        supabaseType: sbHead.type,
        alreadyInR2: r2HeadResult.exists,
      });
    }

    allActions.push(...productActions);

    // Show what the DB patch would look like
    const patch = buildPatch(p, productActions, gallery);
    console.log(`\n    Proposed DB patch for "${p.slug}":`);
    for (const [k, v] of Object.entries(patch)) {
      const display = k === 'gallery' ? v.slice(0, 120) + '…' : v;
      console.log(`      ${k}: ${display}`);
    }
  }

  // Execute if not dry-run
  if (!DRY_RUN) {
    console.log('\n\n  ── EXECUTING Phase 8B ──\n');

    for (const p of allRows) {
      const productActions = allActions.filter(a => a.slug === p.slug);
      let gallery = [];
      try { gallery = typeof p.gallery === 'string' ? JSON.parse(p.gallery) : (p.gallery || []); } catch {}

      for (const a of productActions) {
        if (!a.inSupabase) {
          console.log(`  ✗ SKIP ${a.slug}.${a.field} — source missing from Supabase Storage`);
          continue;
        }

        if (!a.alreadyInR2) {
          process.stdout.write(`  Copying ${a.storagePath} → R2:${a.r2Key} … `);
          const { buffer, type } = await supabaseStorageDownload(a.storagePath);
          await copyToR2(a.storagePath, a.r2Key, type, buffer);
          // Verify
          const verify = await r2Head(a.r2Key);
          if (!verify.exists) throw new Error(`R2 verification failed for ${a.r2Key}`);
          console.log(`✓ (${(verify.size/1024).toFixed(1)} KB)`);
          a.alreadyInR2 = true; // mark verified
        } else {
          console.log(`  Already in R2: ${a.r2Key} — skipping copy`);
        }
      }

      // All files for this product are in R2 — update DB
      const readyActions = productActions.filter(a => a.alreadyInR2);
      if (readyActions.length > 0) {
        const patch = buildPatch(p, readyActions, gallery);
        await dbPatch('products', p.id, patch);
        console.log(`  ✅ DB updated for "${p.slug}"`);
      }
    }
    console.log('\n  ✅ Phase 8B EXECUTE complete.');
  }

  return allActions;
}

function buildPatch(product, actions, gallery) {
  const patch = {};
  let newGallery = [...gallery];
  for (const a of actions) {
    if (!a.inSupabase && !a.alreadyInR2) continue; // skip unreachable files
    if (a.field === 'webp_path') patch.webp_path = a.newUrl;
    else if (a.field === 'pdf_path') patch.pdf_path = a.newUrl;
    else if (a.galleryIdx !== undefined) newGallery[a.galleryIdx] = a.newUrl;
  }
  const galleryChanged = actions.some(a => a.galleryIdx !== undefined && (a.inSupabase || a.alreadyInR2));
  // gallery is a text[] column — send as JS array, not JSON string
  if (galleryChanged) patch.gallery = newGallery;
  return patch;
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('\n════════════════════════════════════════════════════════');
console.log('  PHASE 8 — LEGACY URL MIGRATION');
console.log(`  ${DRY_RUN ? '🔍 DRY RUN (no writes)' : '⚡ EXECUTE MODE'}`);
console.log(`  R2 CDN: ${R2_CDN}`);
console.log(`  Supabase: ${SB}`);
console.log('════════════════════════════════════════════════════════');

const a8a = await phase8A();
const a8b = await phase8B();

// Final summary
const allActions = [...a8a, ...a8b];
const b8bMissing = a8b.filter(a => !a.inSupabase);
const b8bCopyNeeded = a8b.filter(a => a.inSupabase && !a.alreadyInR2);
const b8bAlreadyR2 = a8b.filter(a => a.alreadyInR2);

console.log('\n════════════════════════════════════════════════════════');
console.log('  PHASE 8 SUMMARY');
console.log('════════════════════════════════════════════════════════');
console.log('\n  Phase 8A — "testing" product');
console.log(`    Fields to update        : ${a8a.length}`);
console.log(`    All R2 objects confirmed: ${a8a.every(a => a.r2Exists) ? '✓ YES' : '✗ NO'}`);
console.log(`    DB update               : ${DRY_RUN ? 'DRY RUN — not written' : '✅ WRITTEN'}`);

console.log('\n  Phase 8B — legacy /uploads/ products');
console.log(`    Products                : ${LEGACY_SLUGS.join(', ')}`);
console.log(`    Total URL fields        : ${a8b.length}`);
console.log(`    Files in Supabase       : ${a8b.filter(a => a.inSupabase).length} / ${a8b.length}`);
console.log(`    Files missing Supabase  : ${b8bMissing.length}${b8bMissing.length > 0 ? ' ← CANNOT MIGRATE' : ''}`);
console.log(`    Files already in R2     : ${b8bAlreadyR2.length}`);
console.log(`    Files to copy → R2      : ${b8bCopyNeeded.length}`);
console.log(`    DB update               : ${DRY_RUN ? 'DRY RUN — not written' : '✅ WRITTEN'}`);

if (b8bMissing.length > 0) {
  console.log('\n  ⚠ MISSING FILES (cannot be migrated):');
  for (const a of b8bMissing) {
    console.log(`    ${a.slug}.${a.field}: uploads/${a.storagePath}`);
  }
}

if (DRY_RUN) {
  console.log('\n  ✅ Dry run complete. No database or R2 changes were made.');
  console.log('  To execute: node scripts/phase8-migrate-legacy.mjs --execute');
} else {
  console.log('\n  ✅ Phase 8 execution complete.');
}
console.log('════════════════════════════════════════════════════════\n');
