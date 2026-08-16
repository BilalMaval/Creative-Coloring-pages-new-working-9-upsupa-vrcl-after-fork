/**
 * migrate-to-r2.mjs
 *
 * Copies files from Supabase Storage bucket "uploads" → Cloudflare R2 bucket "ccp-storage",
 * preserving the exact path (images/... and pdfs/...).
 *
 * SAFE: read-only against Supabase. Nothing is deleted or modified in Supabase.
 *
 * Usage:
 *   node scripts/migrate-to-r2.mjs --dry-run          # list what would be copied, touch nothing
 *   node scripts/migrate-to-r2.mjs --test             # copy 1 image + 1 PDF only, then stop
 *   node scripts/migrate-to-r2.mjs                    # full migration
 *   node scripts/migrate-to-r2.mjs --folder=images    # images only
 *   node scripts/migrate-to-r2.mjs --folder=pdfs      # pdfs only
 *   node scripts/migrate-to-r2.mjs --skip-existing    # skip files already in R2
 *
 * Prerequisites:
 *   npm install @aws-sdk/client-s3 @supabase/supabase-js dotenv
 *
 * Env vars needed (add to .env.local or export before running):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME          (default: ccp-storage)
 *   R2_PUBLIC_URL           (optional — your R2 public domain, e.g. https://cdn.creativecoloringpages.online)
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env.local ────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
try {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on environment variables already set
}

// ─── Parse CLI args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN      = args.includes('--dry-run');
const TEST_MODE    = args.includes('--test');
const SKIP_EXISTING = args.includes('--skip-existing');
const folderArg    = args.find(a => a.startsWith('--folder='));
const FOLDER_FILTER = folderArg ? folderArg.split('=')[1] : null; // 'images' | 'pdfs' | null

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID     = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY     = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_KEY     = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET         = process.env.R2_BUCKET_NAME || 'ccp-storage';
const R2_PUBLIC_URL     = process.env.R2_PUBLIC_URL || null;

const SUPABASE_BUCKET   = 'uploads';
const FOLDERS           = FOLDER_FILTER ? [FOLDER_FILTER] : ['images', 'pdfs'];
const PAGE_SIZE         = 100; // Supabase Storage list page size (max 1000)
const CONCURRENCY       = 4;   // parallel uploads at once
const DELAY_MS          = 100; // ms between batches to avoid rate limits

// ─── Validate env ────────────────────────────────────────────────────────────
function validateEnv() {
  const missing = [];
  if (!SUPABASE_URL)     missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!R2_ACCOUNT_ID)    missing.push('R2_ACCOUNT_ID');
  if (!R2_ACCESS_KEY)    missing.push('R2_ACCESS_KEY_ID');
  if (!R2_SECRET_KEY)    missing.push('R2_SECRET_ACCESS_KEY');
  if (missing.length) {
    console.error('\n❌  Missing required environment variables:\n  ' + missing.join('\n  '));
    console.error('\nAdd them to .env.local or export them before running.\n');
    process.exit(1);
  }
}

// ─── Clients ─────────────────────────────────────────────────────────────────
function makeClients() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { persistSession: false },
  });

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY,
      secretAccessKey: R2_SECRET_KEY,
    },
  });

  return { supabase, r2 };
}

// ─── List all files in a Supabase folder (paginated) ─────────────────────────
async function listAllFiles(supabase, folder) {
  const files = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list(folder, { limit: PAGE_SIZE, offset, sortBy: { column: 'name', order: 'asc' } });

    if (error) throw new Error(`Supabase list error (${folder}, offset ${offset}): ${error.message}`);
    if (!data || data.length === 0) break;

    // Filter out placeholder/folder entries (they have no size or a specific name)
    const realFiles = data.filter(f => f.id && f.metadata?.size !== undefined);
    files.push(...realFiles.map(f => ({ name: f.name, path: `${folder}/${f.name}`, size: f.metadata?.size || 0 })));

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return files;
}

// ─── Download from Supabase public URL ───────────────────────────────────────
async function downloadFromSupabase(supabase, path) {
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .download(path);

  if (error) throw new Error(`Download failed for "${path}": ${error.message}`);
  const buffer = Buffer.from(await data.arrayBuffer());
  return { buffer, contentType: data.type || guessMime(path) };
}

// ─── Check if file already exists in R2 ──────────────────────────────────────
async function existsInR2(r2, path) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: path }));
    return true;
  } catch {
    return false;
  }
}

// ─── Upload to R2 ────────────────────────────────────────────────────────────
async function uploadToR2(r2, path, buffer, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: path,
    Body: buffer,
    ContentType: contentType,
  }));
}

// ─── MIME helper ─────────────────────────────────────────────────────────────
function guessMime(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf', zip: 'application/zip', epub: 'application/epub+zip' };
  return map[ext] || 'application/octet-stream';
}

// ─── Format bytes ─────────────────────────────────────────────────────────────
function fmt(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

// ─── Process a batch with concurrency limit ───────────────────────────────────
async function processBatch(items, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const chunk = items.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.allSettled(chunk.map(fn));
    results.push(...chunkResults);
    if (i + CONCURRENCY < items.length) await new Promise(r => setTimeout(r, DELAY_MS));
  }
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  Supabase → R2 Migration');
  console.log('='.repeat(60));
  console.log(`  Mode:    ${DRY_RUN ? '🔍 DRY RUN (nothing written)' : TEST_MODE ? '🧪 TEST (1 image + 1 PDF)' : '🚀 FULL MIGRATION'}`);
  console.log(`  Folders: ${FOLDERS.join(', ')}`);
  console.log(`  Bucket:  ${R2_BUCKET}`);
  if (SKIP_EXISTING) console.log(`  Skip:    existing R2 files`);
  console.log('='.repeat(60) + '\n');

  if (!DRY_RUN) validateEnv();
  else {
    // In dry-run, only Supabase creds are needed
    if (!SUPABASE_URL || !SUPABASE_SERVICE) {
      console.error('❌  Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY even for dry-run (to list files).');
      process.exit(1);
    }
  }

  const { supabase, r2 } = makeClients();

  const stats = { total: 0, copied: 0, skipped: 0, failed: 0, bytes: 0 };
  const errors = [];

  for (const folder of FOLDERS) {
    console.log(`📂  Listing ${folder}/...`);
    let files = await listAllFiles(supabase, folder);

    if (TEST_MODE) {
      files = files.slice(0, 1); // 1 file per folder in test mode
      console.log(`🧪  TEST MODE: limiting to 1 file from ${folder}/`);
    }

    console.log(`    Found ${files.length} file(s) in ${folder}/\n`);
    stats.total += files.length;

    if (DRY_RUN) {
      for (const f of files) {
        const r2Url = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${f.path}` : `r2://${R2_BUCKET}/${f.path}`;
        console.log(`  [DRY-RUN] Would copy: ${f.path} (${fmt(f.size)}) → ${r2Url}`);
        stats.copied++;
      }
      continue;
    }

    // Real migration
    const results = await processBatch(files, async (file) => {
      const label = `  ${file.path} (${fmt(file.size)})`;

      if (SKIP_EXISTING) {
        const exists = await existsInR2(r2, file.path);
        if (exists) {
          console.log(`  ⏭️  SKIP   ${file.path} (already in R2)`);
          stats.skipped++;
          return;
        }
      }

      try {
        const { buffer, contentType } = await downloadFromSupabase(supabase, file.path);
        await uploadToR2(r2, file.path, buffer, contentType || guessMime(file.path));
        const r2Url = R2_PUBLIC_URL
          ? `${R2_PUBLIC_URL}/${file.path}`
          : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${file.path}`;
        console.log(`  ✅ COPIED ${label}`);
        console.log(`         → ${r2Url}`);
        stats.copied++;
        stats.bytes += file.size;
      } catch (err) {
        console.error(`  ❌ FAILED ${label}: ${err.message}`);
        stats.failed++;
        errors.push({ path: file.path, error: err.message });
      }
    });
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  Summary');
  console.log('='.repeat(60));
  console.log(`  Total files:  ${stats.total}`);
  if (DRY_RUN) {
    console.log(`  Would copy:   ${stats.copied}`);
  } else {
    console.log(`  Copied:       ${stats.copied}  (${fmt(stats.bytes)} transferred)`);
    console.log(`  Skipped:      ${stats.skipped}`);
    console.log(`  Failed:       ${stats.failed}`);
  }

  if (errors.length > 0) {
    console.log('\n  ❌  Failed files:');
    for (const e of errors) {
      console.log(`     ${e.path}: ${e.error}`);
    }
    console.log('\n  Tip: re-run with --skip-existing to retry only failed files.');
  }

  if (!DRY_RUN && stats.failed === 0 && !TEST_MODE) {
    console.log('\n  ✅  Migration complete. All files are now in R2.');
    console.log('  Next step: update application code to point to R2 URLs.');
  }

  if (TEST_MODE && stats.failed === 0) {
    console.log('\n  ✅  Test passed. Run without --test to migrate everything.');
  }

  console.log('='.repeat(60) + '\n');
  process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n💥  Unexpected error:', err);
  process.exit(1);
});
