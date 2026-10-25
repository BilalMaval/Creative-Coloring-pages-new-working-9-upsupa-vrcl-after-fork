// Stripe client and settings (server-only).
//
// Keys come from environment variables, never from the browser or the database. Each brand can have its own Stripe account:
//   CCP_STRIPE_SECRET_KEY / CCP_STRIPE_WEBHOOK_SECRET          (creativecoloringpages.online)
//   COLORKIDDY_STRIPE_SECRET_KEY / COLORKIDDY_STRIPE_WEBHOOK_SECRET   (colorkiddy.com)
// and the plain STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are used when a brand has no value of its own (one Stripe account for all).
// Customers pay on Stripe's own hosted page, so no publishable key is needed on the website.
import Stripe from 'stripe';
import { brands, getBrandByDomain, getSiteUrl } from '@/config/brands';
import { getBrandEnv } from '@/lib/brandEnv';

export class StripeNotConfigured extends Error {
  constructor(message = 'Payments are not available right now') {
    super(message);
    this.name = 'StripeNotConfigured';
  }
}

export const brandFromRequest = (request) => getBrandByDomain(request.headers.get('host') || '');

// True on the real production site (Vercel production, or any production build outside Vercel)
const isProduction = () => (process.env.VERCEL_ENV ? process.env.VERCEL_ENV === 'production' : process.env.NODE_ENV === 'production');

export function stripeSettings(brand) {
  const secretKey = getBrandEnv(brand, 'stripeSecretKey', 'STRIPE_SECRET_KEY').trim();
  const webhookSecret = getBrandEnv(brand, 'stripeWebhookSecret', 'STRIPE_WEBHOOK_SECRET').trim();
  const mode = secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_') ? 'live' : secretKey ? 'test' : null;
  // Safety: the real site never accepts test keys by accident, because a "payment" made with a test card is not real money
  // while the downloads it unlocks are real. Allow it deliberately with STRIPE_ALLOW_TEST_KEYS=true.
  const blockedTestKey = mode === 'test' && isProduction() && process.env.STRIPE_ALLOW_TEST_KEYS !== 'true';
  return { secretKey, webhookSecret, mode, configured: !!secretKey && !blockedTestKey, blockedTestKey };
}

const clients = new Map();

export function getStripe(brand) {
  const { secretKey, configured, blockedTestKey } = stripeSettings(brand);
  if (!configured) {
    throw new StripeNotConfigured(blockedTestKey ? 'Stripe test keys are not allowed on the live site' : 'Payments are not available right now');
  }
  if (!clients.has(secretKey)) {
    const options = { maxNetworkRetries: 2, timeout: 20000, appInfo: { name: 'creative-coloring-pages' } };
    // Test hook: STRIPE_API_BASE_URL can point the library at a fake Stripe server running on THIS computer. It is honoured only
    // for localhost addresses, so a real key can never be sent anywhere else by this setting.
    if (process.env.STRIPE_API_BASE_URL) {
      const u = new URL(process.env.STRIPE_API_BASE_URL);
      if (['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)) {
        Object.assign(options, { host: u.hostname, port: u.port || 80, protocol: u.protocol.replace(':', '') });
      }
    }
    clients.set(secretKey, new Stripe(secretKey, options));
  }
  return clients.get(secretKey);
}

// Where Stripe should send the customer back to. Real brand domains use the brand's canonical address; a Vercel Preview or
// localhost keeps the customer on the address they are using, so testing a Preview does not jump to the live site.
export function returnOrigin(request, brand) {
  const host = (request.headers.get('host') || '').toLowerCase().replace(/:\d+$/, '');
  if (host && brands[host]) return getSiteUrl(brand);
  const proto = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${request.headers.get('host')}`;
}

export const toCents = (amount) => Math.round((Number(amount) + Number.EPSILON) * 100);
export const fromCents = (cents) => Math.round(Number(cents)) / 100;

// Link to a payment in the Stripe Dashboard (test-mode payments live under /test/)
export const dashboardPaymentUrl = (paymentId, mode) => `https://dashboard.stripe.com/${mode === 'live' ? '' : 'test/'}payments/${paymentId}`;
