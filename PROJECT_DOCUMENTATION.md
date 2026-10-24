# Creative Coloring Pages — Project Documentation

Last updated: 2026-06-24

## 1. Stack

- **Framework:** Next.js 14.2.3 (App Router)
- **Hosting:** Vercel
- **Database access:** Supabase JS client (`@supabase/supabase-js`) over the REST API (HTTPS, port 443)
- **ORM:** Prisma is present in `package.json`/`prisma/` but is **not functional in local dev** — see §4. Vercel production builds may still use it; verify before relying on it.
- **Styling:** TailwindCSS + shadcn/ui (Radix primitives)
- **Multi-tenant:** brand/domain config lives in `config/brands.js`, resolved per-request from the `host` header (see `lib/seo.js: getCurrentBrand()`)

## 2. Required environment variables

Set these in Vercel → Project → Settings → Environment Variables (values live only in the local `.env`, never commit them):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Runtime database connection (Prisma) through the Supabase **transaction pooler**: port **`6543`** and it **must end with `?pgbouncer=true`** (see "Database connection" below) |
| `DIRECT_URL` | Optional. Only used by Prisma command-line tools (migrations, `db push`) on a developer machine, with the Supabase session pooler or direct string on port `5432`. **Not set in Vercel and not needed there**: the running site never uses it. |
| `NEXT_PUBLIC_BASE_URL` | Fallback base URL when request headers are unavailable (build time) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key — safe for browser, used for read-only REST calls |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only.** Used for writes (reviews, downloads, views). Never expose to the client. |
| `JWT_SECRET` | Admin auth token signing |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Currently commented out / disabled until Stripe checkout is wired up |

### Database connection (Prisma)

Serverless functions start and stop constantly, so the site connects to the database through Supabase's **transaction pooler**
(port `6543`), which shares a small set of real connections between all running instances.

Runtime URL format (placeholders, not real values):

    DATABASE_URL = postgresql://postgres.<project-ref>:<password>@<pooler-host>:6543/postgres?pgbouncer=true

**`?pgbouncer=true` is required.** In transaction mode each query can run on a different real connection, so Prisma must not use
prepared statements. Measured against this project's database with 24 queries in flight across 3 simulated server instances
(read-only test, 144 queries):

| URL | Result |
|---|---|
| port 6543, no suffix | **60 of 144 succeeded**; the rest failed with `prepared statement "sNN" does not exist` (Postgres error 26000) |
| port 6543, `?pgbouncer=true` (the current Production value) | 144 of 144 succeeded |
| port 6543, `?pgbouncer=true&connection_limit=5&pool_timeout=20` | 144 of 144 succeeded, same speed |

`connection_limit` (connections per instance) and `pool_timeout` (seconds to wait for a free one) are **optional tuning**: no
measurable difference was found, so they are not needed. Add them only if a problem shows up under load.

Notes:
- `lib/prisma.js` keeps a single client per process and connects on first use (it no longer connects when imported).
- `DIRECT_URL` is not needed on Vercel (the production site runs without it).
- If the connection ever misbehaves, check first that the value still ends with `?pgbouncer=true`.

## 3. Database access pattern

**Always use the Supabase JS client for new server-side DB work, not Prisma**, until §4 is resolved. Pattern used throughout the API routes:

```js
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
```

Key tables: `products` (has `downloads`, `views` integer columns), `categories` (self-referencing `parent_id` for collection → category hierarchy), `reviews` (no DB-level default on `id`/`updated_at` — must be passed explicitly on insert, see `app/api/reviews/route.js`).

## 4. Known issue: Prisma is broken in local dev (Windows)

On this Windows machine, Prisma cannot reach the Supabase Postgres pooler — the ISP/network blocks ports 6543/5432, producing:

```
PrismaClientInitializationError: FATAL: (ENOTFOUND) postgres.vfiyffogstwmeudvnasp not found
```

This does **not** necessarily affect Vercel production (different network path), but as a precaution, several routes that used to call Prisma have been rewritten to use the Supabase REST client instead, since it works reliably everywhere over HTTPS:

- `app/api/reviews/route.js` — fully rewritten from Prisma → Supabase REST
- `app/api/download/route.js` — download-count increment rewritten from Prisma → Supabase REST
- `app/api/views/route.js` — new route, increments `views` via Supabase REST (was previously not tracked at all)

If you see `PrismaClientInitializationError` in any other route, the fix is the same: replace the Prisma call with an equivalent Supabase REST call (`.from(table).select()/.update()/.insert()`).

## 5. Local dev on Windows — known fixes

- **Use `npm run dev:no-reload`** (or run `next dev` directly) instead of `npm run dev` — the `dev` script's `NODE_OPTIONS='--max-old-space-size=2048'` uses Linux-only quoting syntax that fails on Windows `cmd`/PowerShell.
- **Jest-worker crash on collection/category pages**: Next.js spawns parallel `jest-worker` child processes to compile pages. On this Windows machine those workers crash on heavier pages (`/collection/[slug]`, `/category/[slug]`) with `Error: Jest worker encountered N child process exceptions, exceeding retry limit`. Fixed by forcing single-threaded compilation in `next.config.js`:
  ```js
  experimental: {
    workerThreads: false,
    cpus: 1,
  }
  ```
  This only affects local dev; it has no effect on the Vercel/Linux production build.
- **Running on a port other than 3000**: `npx next dev --hostname 0.0.0.0 --port 3001` (or any free port). Always verify with `netstat -ano | findstr <port>` before assuming a previous background process is still alive — Next.js dev servers on this machine have been observed to die silently after repeated uncaught exceptions without obviously terminating the shell.

## 6. SEO / structured data — current status

| Page | Schemas injected |
|---|---|
| Homepage (`app/page.js`) | `WebSite`, `Organization` |
| Product page (`app/product/[slug]/page.js`) | `BreadcrumbList`, `Product` (with `AggregateRating` when reviews exist), `HowTo` ("How to print this coloring page") |
| Category page (`app/category/[slug]/page.js`) | `BreadcrumbList`, `CollectionPage`, `FAQPage` (5 dynamic Q&As generated from category name) |
| Blog post (`app/blog/[slug]/page.js`) | `BlogPosting` (brand-aware author/publisher/logo/canonical URL), `FAQPage` when the post has FAQs |

Schema generator functions live in `lib/seo.js`: `generateMetadata`, `generateBreadcrumbSchema`, `generateProductSchema`, `generateWebsiteSchema`, `generateOrganizationSchema`, `generateHowToPrintSchema`, `generateCategoryFAQSchema`, `generateArticleSchema`.

**Sitemap**: dynamically generated at `app/sitemap.xml/route.js` (a route handler, not a static file) — includes all products, categories, blog posts, and static pages with `lastmod`/`changefreq`/`priority`. Submit `https://<your-domain>/sitemap.xml` in Google Search Console → Sitemaps.

**Pinterest domain verification**: meta tag `<meta name="p:domain_verify" content="cec57036f897cd1954e89b997411ade0" />` added to `app/layout.js` `<head>` — applies site-wide since it's in the root layout.

## 7. Reviews system

- `app/api/reviews/route.js` — GET (public, anon key) / POST (admin, service role key) / DELETE (admin). Resolves either `productId` or `productSlug`. Maps snake_case DB rows → camelCase for the frontend.
- `components/ReviewPrompt.js` — 3-step modal (rate → name/comment → thank-you) shown automatically after a free download completes (wired in `components/DownloadButton.js`).
- `components/ReviewSection.js` — displays reviews on the product page. Has filter tabs (All / Newest / Best 5★ / Critical 1–2★), a star-rating breakdown bar, and a "Show more" button that reveals 5 more reviews at a time instead of rendering the full list.
- New reviews submitted via the prompt are passed directly up to `ProductPageClient.js` (`pendingReviews` state) and merged into `ReviewSection`'s list immediately — no refetch race condition, no page reload needed.

## 8. Downloads & views tracking

- **Downloads**: `app/api/download/route.js` streams the PDF from Supabase Storage and increments `products.downloads` via Supabase REST (read-then-write, no DB-level increment function configured).
- **Views**: `app/api/views/route.js` (new) increments `products.views`. Triggered once per page load from `app/product/[slug]/ProductPageClient.js` via a `useEffect` `POST` on mount.
- The free-download button (`components/DownloadButton.js`) uses `fetch()` + Blob + `URL.createObjectURL()` instead of an anchor click, so the download never triggers a Next.js client-side navigation (which previously caused the full-page loading spinner to get stuck — see `components/NavigationProgress.js` for the navigation-overlay guard logic, which now skips `blob:`/`data:`/`download`-attribute links and has a 5s safety timeout).

## 9. Other features added this work cycle

- **About page** (`app/about/page.js`) — "Meet the Team" section with 6 members, avatar placeholders, role badges.
- **Homepage trust badges** (`app/page.js`) — SSL Secured, 100% Family Safe, No Registration Required, No Intrusive Ads, Always Free.
- **Blog → category internal linking** (`app/blog/[slug]/page.js`) — `TopicalClusterBox` component maps blog post tags to live category slugs via `TAG_CATEGORY_MAP` and renders up to 5 contextual links into the relevant category pages (topical cluster SEO pattern).

## 10. Deployment

This project deploys to **Vercel**, connected to:

```
Repo:   https://github.com/BilalMaval/Creative-Coloring-pages-new-working-9-upsupa-vrcl-after-fork
Branch: after-audit
```

Pushing to the `after-audit` branch triggers a new Vercel deployment automatically using the **existing environment variables already configured in the Vercel project** — no env var changes are needed for the work described in this document, since all new code reuses the existing Supabase keys.

`vercel.json` config: `buildCommand: "prisma generate && next build"`, `installCommand: "yarn install"`, region `sin1`, API route `maxDuration: 30`.
