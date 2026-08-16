/**
 * verify-r2.mjs  —  READ-ONLY
 *
 * Lists all objects in the R2 bucket and reports counts and sizes.
 * Does NOT upload, delete, overwrite, or modify anything.
 * Does NOT access Supabase.
 * Does NOT print any credentials or secret values.
 *
 * Usage:
 *   node scripts/verify-r2.mjs
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env (same approach as migrate-to-r2.mjs) ─────────────────────────
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
  // rely on env vars already set in shell
}

// ─── Config (read-only, no secrets printed) ──────────────────────────────────
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET     = process.env.R2_BUCKET_NAME || 'ccp-storage';

// ─── Validate ────────────────────────────────────────────────────────────────
const missing = [];
if (!R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
if (!R2_ACCESS_KEY) missing.push('R2_ACCESS_KEY_ID');
if (!R2_SECRET_KEY) missing.push('R2_SECRET_ACCESS_KEY');
if (missing.length) {
  console.error('❌  Missing required env vars: ' + missing.join(', '));
  process.exit(1);
}

// ─── R2 client (same config as migrate-to-r2.mjs) ────────────────────────────
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  const gb = bytes / (1024 * 1024 * 1024);
  return `${bytes.toLocaleString()} bytes  (${mb.toFixed(2)} MB  /  ${gb.toFixed(4)} GB)`;
}

// ─── List all objects (paginated) ────────────────────────────────────────────
async function listAllObjects() {
  const objects = [];
  let continuationToken = undefined;
  let page = 0;

  process.stdout.write('  Paginating through R2 bucket');
  do {
    page++;
    const cmd = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    });
    const resp = await r2.send(cmd);
    const contents = resp.Contents || [];
    objects.push(...contents);
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
    process.stdout.write('.');
  } while (continuationToken);

  console.log(` done (${page} page${page !== 1 ? 's' : ''}).\n`);
  return objects;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  R2 Bucket Verification  —  READ ONLY');
  console.log('='.repeat(60));
  console.log(`  Bucket: ${R2_BUCKET}\n`);

  const objects = await listAllObjects();

  // Tally by prefix
  const images = objects.filter(o => o.Key.startsWith('images/'));
  const pdfs   = objects.filter(o => o.Key.startsWith('pdfs/'));
  const other  = objects.filter(o => !o.Key.startsWith('images/') && !o.Key.startsWith('pdfs/'));

  const totalBytes  = objects.reduce((s, o) => s + (o.Size || 0), 0);
  const imageBytes  = images.reduce((s, o)  => s + (o.Size || 0), 0);
  const pdfBytes    = pdfs.reduce((s, o)    => s + (o.Size || 0), 0);
  const otherBytes  = other.reduce((s, o)   => s + (o.Size || 0), 0);

  console.log('  ── Object counts ──────────────────────────────────────');
  console.log(`  Total objects:          ${objects.length.toLocaleString()}`);
  console.log(`    images/ prefix:       ${images.length.toLocaleString()}`);
  console.log(`    pdfs/   prefix:       ${pdfs.length.toLocaleString()}`);
  if (other.length > 0) {
    console.log(`    other (unexpected):  ${other.length.toLocaleString()}`);
    console.log('    Unexpected keys:');
    other.slice(0, 10).forEach(o => console.log(`      ${o.Key}`));
    if (other.length > 10) console.log(`      … and ${other.length - 10} more`);
  }

  console.log('\n  ── Storage sizes ──────────────────────────────────────');
  console.log(`  Total:    ${fmtBytes(totalBytes)}`);
  console.log(`  images/:  ${fmtBytes(imageBytes)}`);
  console.log(`  pdfs/:    ${fmtBytes(pdfBytes)}`);
  if (other.length > 0) {
    console.log(`  other/:   ${fmtBytes(otherBytes)}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n💥  Error:', err.message);
  process.exit(1);
});
