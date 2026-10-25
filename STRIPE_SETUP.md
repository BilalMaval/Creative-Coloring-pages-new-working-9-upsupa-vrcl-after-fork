# Stripe setup guide

Payments use Stripe Checkout (Stripe's hosted payment page). Card details never touch this site.

## How it works
1. Customer clicks **Pay** on `/checkout` -> `POST /api/stripe/create-checkout`. The server re-prices the cart from the database (browser prices are ignored), applies the coupon, saves a PENDING order and redirects to Stripe.
2. Stripe calls `POST /api/stripe/webhook` (signature checked) -> the order becomes PAID, downloads are unlocked, coupon use is counted, confirmation email is sent.
3. Customer returns to `/checkout/success`, which confirms the payment (and finishes the order itself if the webhook is late) and shows the downloads.
4. Refunds: Admin -> Orders -> **Refund** (full or partial), or refund in the Stripe Dashboard (the `charge.refunded` webhook updates the order).
5. Free orders (100% coupon / free items only) never touch Stripe.

## Environment variables (Vercel -> Settings -> Environment Variables, then redeploy)
| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` (or `sk_test_...` for testing) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from the webhook endpoint |
| `CCP_STRIPE_SECRET_KEY` / `COLORKIDDY_STRIPE_SECRET_KEY` | optional per-brand keys (win over the shared one) |
| `CCP_STRIPE_WEBHOOK_SECRET` / `COLORKIDDY_STRIPE_WEBHOOK_SECRET` | optional per-brand webhook secrets |
| `STRIPE_ALLOW_TEST_KEYS=true` | only to try test keys on the Production site (otherwise blocked) |
| `STRIPE_AUTOMATIC_TAX=true` | optional: Stripe Tax (also set `STRIPE_TAX_CODE`, `STRIPE_TAX_BEHAVIOR`) |

No publishable key is needed. Never set `ALLOW_DEMO_CHECKOUT` in production. Put keys only in Vercel / local `.env`, never in chat or git.

## Stripe Dashboard steps
1. **Activate the account** (business details, bank account for payouts). Required for live mode.
2. **Developers -> API keys**: copy the Secret key (test mode first, live later).
3. **Developers -> Webhooks -> Add endpoint**: URL `https://www.creativecoloringpages.online/api/stripe/webhook` (add one for the Colorkiddy domain if it is separate). Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, optionally `charge.dispute.created`. Copy the **Signing secret** (`whsec_...`).
4. **Settings -> Payment methods**: enable cards, Apple Pay, Google Pay, Link.
5. **Settings -> Branding**: logo, colors, business name. **Public details**: support email/phone, statement descriptor.
6. **Settings -> Emails**: turn on successful-payment receipts and refund emails.
7. **Tax**: decide whether you need Stripe Tax; if yes enable it and set `STRIPE_AUTOMATIC_TAX=true`.
8. Optional: Radar rules, 3D Secure.

## Testing (test mode)
- Local: `stripe listen --forward-to localhost:3000/api/stripe/webhook` gives a temporary `whsec_` for your local `.env`.
- Vercel Preview URLs are behind Vercel login, so Stripe cannot reach them; test locally, or on Production with test keys + `STRIPE_ALLOW_TEST_KEYS=true`.
- Cards: `4242 4242 4242 4242` success, `4000 0025 0000 3155` 3D Secure, `4000 0000 0000 9995` declined. Any future expiry, any CVC.
- Check: order turns PAID in Admin -> Orders, downloads work, refund button works.

## Cloudflare
Add a WAF **Skip** rule for URI path `/api/stripe/webhook` (skip bot fight / managed rules / rate limiting), or Stripe deliveries may be blocked.

## Go live
1. Swap to live `STRIPE_SECRET_KEY`, create the webhook in **live** mode, set its `STRIPE_WEBHOOK_SECRET`, remove `STRIPE_ALLOW_TEST_KEYS`.
2. Redeploy Production.
3. Make one small real purchase, confirm downloads + email, then refund it from Admin -> Orders.

## Troubleshooting
- Order stays PENDING: check Developers -> Webhooks -> delivery log; wrong `whsec_`, Cloudflare block, or missing events.
- "Payment is not available" (503): key or webhook secret missing, or a test key on Production without `STRIPE_ALLOW_TEST_KEYS`.
- Orders under $0.50 are refused (Stripe minimum).
- An order flagged `paymentIssue` (amount mismatch) stays PENDING; review it in the Stripe Dashboard.
