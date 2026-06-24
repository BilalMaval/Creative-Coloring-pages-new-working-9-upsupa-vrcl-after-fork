// Lazy client — avoids throwing at module-import time (which would crash
// the Next.js build's "Collecting page data" step if env vars are
// momentarily unavailable). Errors now surface only when a route uses it.
export { supabase } from './supabaseClients';
