// Signed session tokens + admin guard. Uses only Web Crypto so it runs in the Edge middleware and in Node route handlers.
// Token = base64url(JSON payload) + "." + base64url(HMAC-SHA256). The cookie never contains a password.
//
// Secret: AUTH_SECRET if set, otherwise derived from SUPABASE_SERVICE_ROLE_KEY (server-only, already configured).
// Rotating either value logs every admin out.

const enc = new TextEncoder();
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function toB64Url(bytes) {
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey() {
  const raw = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw) return null;
  return crypto.subtle.importKey('raw', enc.encode(`ccp-admin-session:${raw}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signSession({ email, role }, ttlSeconds = SESSION_TTL_SECONDS) {
  const key = await getKey();
  if (!key) throw new Error('No AUTH_SECRET or SUPABASE_SERVICE_ROLE_KEY configured');
  const payload = toB64Url(enc.encode(JSON.stringify({ email, role, exp: Math.floor(Date.now() / 1000) + ttlSeconds })));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
  return `${payload}.${toB64Url(sig)}`;
}

export async function verifySession(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const key = await getKey();
    if (!key) return null;
    const ok = await crypto.subtle.verify('HMAC', key, fromB64Url(sig), enc.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64Url(payload)));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: data.email, role: data.role };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = 'auth_token';
export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;

const json = (status, error) =>
  new Response(JSON.stringify({ success: false, error }), { status, headers: { 'Content-Type': 'application/json' } });

// Usage in a route handler:  const denied = await requireAdmin(request); if (denied) return denied;
export async function requireAdmin(request) {
  const session = await verifySession(request.cookies?.get(SESSION_COOKIE)?.value);
  if (!session) return json(401, 'Authentication required');
  if (session.role !== 'ADMIN') return json(403, 'Admin access required');

  // CSRF defence for state-changing requests: the browser-sent Origin must match this host.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin) {
      let originHost = '';
      try { originHost = new URL(origin).host; } catch {}
      if (originHost !== host) return json(403, 'Cross-origin request blocked');
    }
  }
  return null;
}

// For public endpoints that expose extra data to admins only (e.g. drafts).
export async function isAdminRequest(request) {
  const session = await verifySession(request.cookies?.get(SESSION_COOKIE)?.value);
  return session?.role === 'ADMIN';
}
