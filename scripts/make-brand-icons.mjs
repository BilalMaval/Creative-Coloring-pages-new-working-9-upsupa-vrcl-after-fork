// Creates small PNG icons from a brand logo already in R2 (favicon 64px, apple-touch 180px).
// Usage: node scripts/make-brand-icons.mjs brand/ccp-logo.png   -> brand/ccp-icon-64.png, brand/ccp-icon-180.png (never overwrites)
import fs from 'fs';
import sharp from 'sharp';
import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
const srcKey = process.argv[2]; if (!srcKey) throw new Error('usage: node scripts/make-brand-icons.mjs <key>');
const env = Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}));
const Bucket = env.R2_BUCKET_NAME || env.R2_BUCKET || 'ccp-storage';
const s3 = new S3Client({ region:'auto', endpoint:`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials:{ accessKeyId:env.R2_ACCESS_KEY_ID, secretAccessKey:env.R2_SECRET_ACCESS_KEY } });
const input = Buffer.from(await (await s3.send(new GetObjectCommand({ Bucket, Key: srcKey }))).Body.transformToByteArray());
const base = srcKey.replace(/-?logo\.[^.]+$/, '');
for (const size of [64, 180]) {
  const Key = `${base}-icon-${size}.png`;
  let exists = true; try { await s3.send(new HeadObjectCommand({ Bucket, Key })); } catch { exists = false; }
  if (exists) { console.log(`${Key} already exists, skipped`); continue; }
  const out = await sharp(input).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
  await s3.send(new PutObjectCommand({ Bucket, Key, Body: out, ContentType: 'image/png', CacheControl: 'public, max-age=31536000, immutable' }));
  console.log(`${Key}: ${(out.length / 1024).toFixed(1)} KB`);
}
