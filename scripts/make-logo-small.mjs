// Creates a 320px WebP of a brand logo (for header/footer/hero) next to the full-size original in R2.
// Usage: node scripts/make-logo-small.mjs brand/ccp-logo.png   -> writes brand/ccp-logo-320.webp (never overwrites)
import fs from 'fs';
import sharp from 'sharp';
import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
const srcKey = process.argv[2]; if (!srcKey) throw new Error('usage: node scripts/make-logo-small.mjs <key>');
const env = Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}));
const Bucket = env.R2_BUCKET_NAME || env.R2_BUCKET || 'ccp-storage';
const s3 = new S3Client({ region:'auto', endpoint:`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials:{ accessKeyId:env.R2_ACCESS_KEY_ID, secretAccessKey:env.R2_SECRET_ACCESS_KEY } });
const Key = srcKey.replace(/\.[^.]+$/, '') + '-320.webp';
try { await s3.send(new HeadObjectCommand({ Bucket, Key })); throw new Error(`${Key} already exists`); } catch (e) { if (e.message.includes('already exists')) throw e; }
const input = Buffer.from(await (await s3.send(new GetObjectCommand({ Bucket, Key: srcKey }))).Body.transformToByteArray());
const out = await sharp(input).resize({ width: 320, withoutEnlargement: true }).webp({ quality: 85, effort: 5 }).toBuffer();
await s3.send(new PutObjectCommand({ Bucket, Key, Body: out, ContentType: 'image/webp', CacheControl: 'public, max-age=31536000, immutable' }));
console.log(`${srcKey} (${(input.length/1024).toFixed(0)} KB) -> ${Key} (${(out.length/1024).toFixed(1)} KB)`);
const pub = (env.R2_PUBLIC_URL || 'https://cdn.creativecoloringpages.online').replace(/\/$/, '');
const r = await fetch(`${pub}/${Key}`); console.log('CDN', r.status, r.headers.get('content-type'));
