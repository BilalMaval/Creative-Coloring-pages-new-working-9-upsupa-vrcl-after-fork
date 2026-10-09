import crypto from 'crypto';
import { signSession, verifySession } from './adminAuth';

// Passwords are stored as "scrypt$<salt>$<hash>" (salted, slow). Legacy unsalted SHA-256 hex hashes are still
// accepted so existing accounts keep working until their password is reset (scripts/set-admin-password.mjs).
const SCRYPT_PREFIX = 'scrypt$';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${SCRYPT_PREFIX}${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;

  if (stored.startsWith(SCRYPT_PREFIX)) {
    const [, salt, hash] = stored.split('$');
    if (!salt || !hash) return false;
    const candidate = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
  }

  // Legacy: unsalted SHA-256
  const legacy = Buffer.from(crypto.createHash('sha256').update(password).digest('hex'));
  const expected = Buffer.from(stored);
  return expected.length === legacy.length && crypto.timingSafeEqual(legacy, expected);
}

// Signed session token (no password inside). See lib/adminAuth.js.
export async function createAuthToken(email, role) {
  return signSession({ email, role });
}

export async function verifyAuth(token) {
  return verifySession(token);
}
