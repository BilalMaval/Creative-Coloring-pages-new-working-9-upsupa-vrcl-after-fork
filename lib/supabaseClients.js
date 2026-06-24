import { createClient } from '@supabase/supabase-js';

// Lazy singleton clients — env vars are read on first *use*, not at module
// import time. Next.js's "Collecting page data" build step imports every
// route module to statically analyze it; if a client were constructed at
// the top level and an env var were momentarily unavailable in that build
// context, the whole build would fail (this happened in production).
// Proxies defer the real createClient() call until a property (e.g.
// `.from`) is actually accessed, which only happens at request time.

let _anonClient;
function getAnonClient() {
  if (!_anonClient) {
    _anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );
  }
  return _anonClient;
}

let _adminClient;
function getAdminClient() {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return _adminClient;
}

// Public read client (anon key) — safe for unauthenticated reads.
export const supabase = new Proxy({}, {
  get(_target, prop) {
    return getAnonClient()[prop];
  },
});

// Admin write client (service role key) — server-only, never expose to the browser.
export const admin = new Proxy({}, {
  get(_target, prop) {
    return getAdminClient()[prop];
  },
});
