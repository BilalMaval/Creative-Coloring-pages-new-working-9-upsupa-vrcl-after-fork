// READ-ONLY diagnostic — reports URL origins only, never prints credentials
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');

// Load .env manually
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

function classifyUrl(url) {
  if (!url) return 'null/empty';
  try {
    const { hostname } = new URL(url);
    if (hostname === 'cdn.creativecoloringpages.online') return `R2 (cdn.creativecoloringpages.online)`;
    if (hostname.endsWith('.supabase.co')) return `Supabase (${hostname})`;
    return `Unknown origin: ${hostname}`;
  } catch {
    return `Invalid URL: ${url.slice(0, 60)}`;
  }
}

// Fetch newest 3 products ordered by created_at desc
const res = await fetch(
  `${SUPABASE_URL}/rest/v1/products?select=id,title,created_at,webp_path,pdf_path&order=created_at.desc&limit=3`,
  {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  }
);

if (!res.ok) {
  console.error('Supabase query failed:', res.status, await res.text());
  process.exit(1);
}

const products = await res.json();

if (!products.length) {
  console.log('No products found.');
  process.exit(0);
}

console.log(`\n=== Newest ${products.length} product(s) ===\n`);

for (const p of products) {
  const webpOrigin = classifyUrl(p.webp_path);
  const pdfOrigin  = classifyUrl(p.pdf_path);

  console.log(`Product: "${p.title}" (id: ${p.id})`);
  console.log(`  created_at : ${p.created_at}`);
  console.log(`  webp_path  : ${webpOrigin}`);
  console.log(`  pdf_path   : ${pdfOrigin}`);

  // For R2 URLs, confirm the CDN hostname is present
  if (p.webp_path?.includes('cdn.creativecoloringpages.online')) {
    console.log(`  webp CDN confirmed : YES`);
  }
  if (p.pdf_path?.includes('cdn.creativecoloringpages.online')) {
    console.log(`  pdf  CDN confirmed : YES`);
  }
  console.log();
}

// Also check what the download route does with the newest product's pdf_path
const newest = products[0];
if (newest?.pdf_path) {
  console.log('=== Download route trace for newest product ===');
  console.log(`pdf_path origin : ${classifyUrl(newest.pdf_path)}`);

  // Simulate the storageKey extraction (same regex as DownloadButton.js)
  const storageKey = newest.pdf_path.replace(/^.*?\/(pdfs\/|images\/)/, '$1');
  console.log(`storageKey extracted : ${storageKey}`);
  console.log(`→ /api/download will call R2 GetObjectCommand with Key="${storageKey}"`);
  console.log(`→ R2 bucket: ${process.env.R2_BUCKET_NAME || 'ccp-storage'}`);
}
