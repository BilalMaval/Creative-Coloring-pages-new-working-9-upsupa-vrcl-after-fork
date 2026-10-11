import { S3Client } from '@aws-sdk/client-s3';

// Lazy singleton — env vars read on first use, not at module import time.
// Matches the same pattern used in lib/supabaseClients.js so the Next.js
// build step never crashes if env vars are momentarily unavailable.
let _r2Client;

export function getR2Client() {
  if (!_r2Client) {
    _r2Client = new S3Client({
      region: 'auto',
      // Keep signed upload URLs free of checksum parameters (R2 does not need them; browsers PUT the raw file)
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId:     process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _r2Client;
}

export const R2_BUCKET     = () => process.env.R2_BUCKET_NAME || 'ccp-storage';
export const R2_PUBLIC_URL = () => (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
