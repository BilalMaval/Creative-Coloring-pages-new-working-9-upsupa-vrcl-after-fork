// READ-ONLY URL verification — uploads a tiny test file to R2 and confirms the returned URL
// Does NOT write to the database. Safe to run and clean up.
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

console.log('R2_PUBLIC_URL env =>', process.env.R2_PUBLIC_URL || '(empty)');
console.log('R2_BUCKET_NAME env =>', process.env.R2_BUCKET_NAME || '(empty)');
console.log();

const { uploadFile } = await import('../lib/upload.js');

// Test 1: image upload
const imageBuffer = Buffer.from('fake-image-data');
const imageUrl = await uploadFile(imageBuffer, 'images', 'test-diagnostic.jpeg', 'image/jpeg');
console.log('Image upload returned URL:');
console.log(' ', imageUrl);
console.log('  starts with CDN?', imageUrl.startsWith('https://cdn.creativecoloringpages.online/images/') ? 'YES ✓' : 'NO ✗');
console.log();

// Test 2: PDF upload
const pdfBuffer = Buffer.from('%PDF-1.4 fake-pdf');
const pdfUrl = await uploadFile(pdfBuffer, 'pdfs', 'test-diagnostic.pdf', 'application/pdf');
console.log('PDF upload returned URL:');
console.log(' ', pdfUrl);
console.log('  starts with CDN?', pdfUrl.startsWith('https://cdn.creativecoloringpages.online/pdfs/') ? 'YES ✓' : 'NO ✗');
