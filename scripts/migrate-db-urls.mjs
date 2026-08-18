/**
 * migrate-db-urls.mjs
 *
 * Replaces Supabase Storage URLs in the database with equivalent R2 CDN URLs.
 *
 * Usage:
 *   node scripts/migrate-db-urls.mjs --dry-run     (inspect only, no writes)
 *   node scripts/migrate-db-urls.mjs --execute     (perform actual update)
 *
 * Safety rules:
 *   - Only touches fields known to contain storage URLs
 *   - Only rewrites URLs matching the Supabase Storage pattern
 *   - Preserves exact filenames and paths
 *   - JSON gallery arrays are parsed, URLs replaced, re-serialised
 *   - Idempotent: running twice produces the same result
 *   - Never deletes any record or any other field
 *   - Dry-run by default; requires explicit --execute flag to write
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env ─────────────────────────────────────────────────────────────────
const envRaw = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
for (const line of envRaw.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_CDN           = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !R2_CDN) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, R2_PUBLIC_URL');
  process.exit(1);
}

const DRY_RUN = !process.argv.includes('--execute');
const SUPABASE_STORAGE_PATTERN = /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/uploads\/(images\/[^\s"']+|pdfs\/[^\s"']+)/g;

// ── URL conversion ────────────────────────────────────────────────────────────

function convertUrl(url) {
  // Extract the path after /uploads/ and prepend R2 CDN
  const match = url.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
  if (!match) return url; // not a storage URL — return unchanged
  return `${R2_CDN}/${match[1]}`;
}

function replaceStorageUrls(text) {
  if (!text || typeof text !== 'string') return { updated: text, count: 0 };
  let count = 0;
  const updated = text.replace(SUPABASE_STORAGE_PATTERN, (match) => {
    const converted = convertUrl(match);
    if (converted !== match) count++;
    return converted;
  });
  return { updated, count };
}

// ── Supabase REST helpers ─────────────────────────────────────────────────────

async function dbQuery(table, select, filters = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${filters}`;
  const res = await fetch(url, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`GET ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function dbUpdate(table, id, patch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`PATCH ${table} id=${id}: ${res.status} ${await res.text()}`);
}

// ── Field definitions ─────────────────────────────────────────────────────────
// Each entry: { table, idField, fields: [{name, isJson}] }

const FIELD_SPECS = [
  {
    table: 'products',
    idField: 'id',
    fields: [
      { name: 'webp_path', isJson: false },
      { name: 'pdf_path',  isJson: false },
      { name: 'gallery',   isJson: true  },
    ],
  },
  {
    table: 'categories',
    idField: 'id',
    fields: [
      { name: 'image',      isJson: false },
      { name: 'icon_image', isJson: false },
    ],
  },
  {
    table: 'blog_posts',
    idField: 'id',
    fields: [
      { name: 'cover_image', isJson: false },
    ],
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('\n════════════════════════════════════════════════════════');
console.log(`  DATABASE URL MIGRATION  [${DRY_RUN ? 'DRY RUN — no writes' : '⚡ EXECUTE MODE — writing to DB'}]`);
console.log('════════════════════════════════════════════════════════\n');
console.log(`  R2 CDN target : ${R2_CDN}`);
console.log(`  Supabase URL  : ${SUPABASE_URL}`);
console.log();

let totalUrlsChanged   = 0;
let totalFieldsChanged = 0;
let totalRowsChanged   = 0;
let totalRowsScanned   = 0;

const changeLog = []; // { table, id, field, before, after }

for (const spec of FIELD_SPECS) {
  const selectFields = [spec.idField, ...spec.fields.map(f => f.name)].join(',');
  const rows = await dbQuery(spec.table, selectFields);
  totalRowsScanned += rows.length;

  console.log(`─── ${spec.table} (${rows.length} rows) ───`);

  for (const row of rows) {
    const rowId    = row[spec.idField];
    const patch    = {};
    let rowChanged = false;

    for (const fieldSpec of spec.fields) {
      const rawValue = row[fieldSpec.name];
      if (!rawValue) continue;

      if (fieldSpec.isJson) {
        // Gallery: parse the JSON array, replace URLs in each element
        let arr;
        try {
          arr = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
        } catch {
          console.warn(`  ⚠ Could not parse JSON for ${spec.table}.${fieldSpec.name} id=${rowId}`);
          continue;
        }
        if (!Array.isArray(arr)) continue;

        let fieldUrlCount = 0;
        const newArr = arr.map(item => {
          if (typeof item === 'string') {
            const { updated, count } = replaceStorageUrls(item);
            fieldUrlCount += count;
            return updated;
          }
          return item;
        });

        if (fieldUrlCount > 0) {
          const newJson = JSON.stringify(newArr);
          patch[fieldSpec.name] = newJson;
          changeLog.push({ table: spec.table, id: rowId, field: fieldSpec.name,
            before: JSON.stringify(arr), after: newJson, urlCount: fieldUrlCount });
          totalUrlsChanged   += fieldUrlCount;
          totalFieldsChanged += 1;
          rowChanged          = true;
        }
      } else {
        // Plain string field
        const { updated, count } = replaceStorageUrls(rawValue);
        if (count > 0) {
          patch[fieldSpec.name] = updated;
          changeLog.push({ table: spec.table, id: rowId, field: fieldSpec.name,
            before: rawValue, after: updated, urlCount: count });
          totalUrlsChanged   += count;
          totalFieldsChanged += 1;
          rowChanged          = true;
        }
      }
    }

    if (rowChanged) {
      totalRowsChanged++;
      if (!DRY_RUN) {
        await dbUpdate(spec.table, rowId, patch);
        process.stdout.write('.');
      }
    }
  }

  const tableChanges = changeLog.filter(c => c.table === spec.table);
  console.log(`  Rows with changes: ${tableChanges.length > 0 ? tableChanges.length : 0}`);
  for (const c of tableChanges) {
    const before = c.before.length > 90 ? c.before.slice(0, 90) + '…' : c.before;
    const after  = c.after.length  > 90 ? c.after.slice(0, 90)  + '…' : c.after;
    console.log(`    [${c.field}] id=${c.id.slice(0, 8)}… (${c.urlCount} URL${c.urlCount > 1 ? 's' : ''})`);
    console.log(`      BEFORE: ${before}`);
    console.log(`      AFTER : ${after}`);
  }
  console.log();
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('════════════════════════════════════════════════════════');
console.log('  SUMMARY');
console.log('════════════════════════════════════════════════════════');
console.log(`  Mode              : ${DRY_RUN ? 'DRY RUN (no changes written)' : 'EXECUTED'}`);
console.log(`  Rows scanned      : ${totalRowsScanned}`);
console.log(`  Rows to change    : ${totalRowsChanged}`);
console.log(`  Fields to change  : ${totalFieldsChanged}`);
console.log(`  URLs to replace   : ${totalUrlsChanged}`);
console.log();

if (DRY_RUN) {
  console.log('  ✅ Dry run complete. No database changes were made.');
  console.log('  To execute: node scripts/migrate-db-urls.mjs --execute');
} else {
  console.log('  ✅ Migration complete. All Supabase Storage URLs replaced with R2 CDN URLs.');
}
console.log('════════════════════════════════════════════════════════\n');
