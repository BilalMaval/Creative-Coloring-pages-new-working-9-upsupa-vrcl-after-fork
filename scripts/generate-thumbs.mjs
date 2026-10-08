// Backfill WebP thumbnails (thumbs/<name>.webp, 480px wide) for every CDN image referenced by the database.
// Additive only: never overwrites an existing thumbnail and never touches originals.
// Usage: node scripts/generate-thumbs.mjs [--dry]
import fs from 'fs';
import sharp from 'sharp';
import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const DRY = process.argv.includes('--dry');
const WIDTH = 480;
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));
const SB = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const bucket = env.R2_BUCKET_NAME || env.R2_BUCKET || 'ccp-storage';
const s3 = new S3Client({ region: 'auto', endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY } });

const q = async (p) => { const r = await fetch(`${SB}/rest/v1/${p}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }); if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); };
const IMG = /^https:\/\/cdn\.[^/]+\/(images\/[^/?#]+\.(?:png|jpe?g|webp|gif))$/i;

const urls = new Set();
const add = (u) => { if (typeof u === 'string' && IMG.test(u)) urls.add(u.match(IMG)[1]); };
for (let from = 0; ; from += 1000) {
  const rows = await q(`products?select=webp_path,gallery&order=id&offset=${from}&limit=1000`);
  rows.forEach((r) => { add(r.webp_path); (Array.isArray(r.gallery) ? r.gallery : []).forEach(add); });
  if (rows.length < 1000) break;
}
(await q('categories?select=image,icon_image&limit=1000')).forEach((r) => { add(r.image); add(r.icon_image); });
const keys = [...urls];
console.log(`${keys.length} distinct source images referenced by the database`);

const exists = async (Key) => { try { await s3.send(new HeadObjectCommand({ Bucket: bucket, Key })); return true; } catch { return false; } };
const thumbOf = (k) => `thumbs/${k.match(/^images\/([^/]+)\./)[1]}.webp`;

let todo = [];
for (let i = 0; i < keys.length; i += 20) {
  const batch = keys.slice(i, i + 20);
  const res = await Promise.all(batch.map(async (k) => ((await exists(thumbOf(k))) ? null : k)));
  todo.push(...res.filter(Boolean));
}
console.log(`${keys.length - todo.length} thumbnails already exist, ${todo.length} to create${DRY ? ' (dry run — nothing written)' : ''}`);
if (DRY) process.exit(0);

let done = 0, failed = [], inBytes = 0, outBytes = 0;
async function work(k) {
  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: k }));
    const input = Buffer.from(await obj.Body.transformToByteArray());
    const out = await sharp(input).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 72, effort: 4 }).toBuffer();
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: thumbOf(k), Body: out, ContentType: 'image/webp', CacheControl: 'public, max-age=31536000, immutable' }));
    inBytes += input.length; outBytes += out.length;
  } catch (e) { failed.push(`${k}: ${e.message}`); }
  if (++done % 50 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}  avg original ${(inBytes / Math.max(1, done - failed.length) / 1024).toFixed(0)} KB -> thumb ${(outBytes / Math.max(1, done - failed.length) / 1024).toFixed(0)} KB`);
}
const queue = [...todo];
await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await work(queue.shift()); }));
console.log(`finished: ${done - failed.length} created, ${failed.length} failed; ${(inBytes / 1048576).toFixed(1)} MB -> ${(outBytes / 1048576).toFixed(1)} MB`);
failed.slice(0, 10).forEach((f) => console.log('  FAILED', f));
