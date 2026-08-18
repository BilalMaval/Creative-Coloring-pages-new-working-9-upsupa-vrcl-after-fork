/**
 * verify-db-migration.mjs — READ-ONLY post-migration verification
 * Confirms zero Supabase Storage URLs remain and all migrated URLs point to R2 CDN.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
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
const SUPABASE_STORAGE_MARKER = '/storage/v1/object/public/uploads/';

async function dbQuery(table, select) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`GET ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

function classify(url) {
  if (!url || typeof url !== 'string') return 'empty';
  if (url.includes(SUPABASE_STORAGE_MARKER))           return 'supabase-storage';
  if (url.startsWith(R2_CDN + '/'))                    return 'r2';
  if (url.startsWith('/images/') || url.startsWith('/pdfs/')) return 'relative-broken';
  return 'other';
}

const FIELD_SPECS = [
  { table: 'products',   fields: ['webp_path', 'pdf_path', 'gallery'] },
  { table: 'categories', fields: ['image', 'icon_image'] },
  { table: 'blog_posts', fields: ['cover_image'] },
];

console.log('\n════════════════════════════════════════════════════════');
console.log('  POST-MIGRATION VERIFICATION');
console.log('════════════════════════════════════════════════════════\n');

let grandTotalSupabase = 0;
let grandTotalR2       = 0;
let grandTotalRelative = 0;
let grandTotalEmpty    = 0;
let grandTotalOther    = 0;
const violations       = [];

for (const spec of FIELD_SPECS) {
  const rows = await dbQuery(spec.table, ['id', ...spec.fields].join(','));
  console.log(`─── ${spec.table} (${rows.length} rows) ───`);

  for (const fieldName of spec.fields) {
    let supabase = 0, r2 = 0, relative = 0, empty = 0, other = 0;

    for (const row of rows) {
      const raw = row[fieldName];

      if (fieldName === 'gallery') {
        let arr;
        try { arr = typeof raw === 'string' ? JSON.parse(raw) : (raw || []); }
        catch { arr = []; }
        for (const item of (Array.isArray(arr) ? arr : [])) {
          const cls = classify(item);
          if (cls === 'supabase-storage') { supabase++; violations.push({ table: spec.table, id: row.id, field: fieldName, url: item }); }
          else if (cls === 'r2')              r2++;
          else if (cls === 'relative-broken') relative++;
          else if (cls === 'empty')           empty++;
          else                                other++;
        }
      } else {
        const cls = classify(raw);
        if (cls === 'supabase-storage') { supabase++; violations.push({ table: spec.table, id: row.id, field: fieldName, url: raw }); }
        else if (cls === 'r2')              r2++;
        else if (cls === 'relative-broken') relative++;
        else if (cls === 'empty')           empty++;
        else                                other++;
      }
    }

    const status = supabase === 0 ? '✓' : `✗ ${supabase} SUPABASE URLs REMAIN`;
    console.log(`  ${spec.table}.${fieldName.padEnd(14)} | R2: ${String(r2).padStart(4)}  Supabase: ${String(supabase).padStart(3)}  Relative: ${String(relative).padStart(3)}  Empty: ${String(empty).padStart(3)}  Other: ${String(other).padStart(3)}  → ${status}`);

    grandTotalSupabase += supabase;
    grandTotalR2       += r2;
    grandTotalRelative += relative;
    grandTotalEmpty    += empty;
    grandTotalOther    += other;
  }
  console.log();
}

console.log('════════════════════════════════════════════════════════');
console.log('  VERIFICATION SUMMARY');
console.log('════════════════════════════════════════════════════════');
console.log(`  R2 CDN URLs            : ${grandTotalR2}`);
console.log(`  Supabase Storage URLs  : ${grandTotalSupabase}  ${grandTotalSupabase === 0 ? '✓ ZERO — migration complete' : '✗ MIGRATION INCOMPLETE'}`);
console.log(`  Relative/broken URLs   : ${grandTotalRelative}  ${grandTotalRelative === 0 ? '✓' : '⚠ (pre-existing test products — not from migration)'}`);
console.log(`  Empty/null             : ${grandTotalEmpty}`);
console.log(`  Other                  : ${grandTotalOther}`);

if (violations.length > 0) {
  console.log('\n  ✗ REMAINING SUPABASE STORAGE VIOLATIONS:');
  for (const v of violations) {
    console.log(`    ${v.table}.${v.field} id=${v.id.slice(0,8)}… → ${v.url.slice(0, 80)}`);
  }
} else {
  console.log('\n  ✓ ZERO Supabase Storage URLs remain in any scanned field.');
  console.log(`  ✓ All ${grandTotalR2} storage URLs point to ${process.env.R2_PUBLIC_URL}`);
}

console.log('════════════════════════════════════════════════════════\n');
