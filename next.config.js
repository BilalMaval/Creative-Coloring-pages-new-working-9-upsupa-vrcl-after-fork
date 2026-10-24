// old product slug -> new slug (products renamed to remove third-party character names); each becomes a permanent redirect
const productRenames = require('./config/product-renames.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel optimized - no standalone needed for Vercel
  images: {
    remotePatterns: [
      // R2 CDN — primary storage backend
      {
        protocol: 'https',
        hostname: 'cdn.creativecoloringpages.online',
      },
      {
        protocol: 'https',
        hostname: 'customer-assets.emergentagent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
    ],
    // Disabled again: Vercel's Hobby plan Image Optimization quota kept
    // getting exhausted (confirmed via 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED
    // on /_next/image in production), which breaks every product image and
    // icon site-wide until the monthly quota resets. unoptimized:true makes
    // <Image> serve the original file straight from Supabase Storage,
    // trading away automatic resize/WebP conversion for guaranteed uptime.
    // Images are now served from Cloudflare R2 CDN.
    // Re-enable (set back to false) once the Vercel plan is upgraded.
    deviceSizes: [640, 768, 1080, 1920],
    imageSizes: [96, 128, 256, 384],
    unoptimized: true,
  },
  experimental: {
    // Prisma is no longer used — kept to avoid breaking older cached builds
    serverComponentsExternalPackages: ['@prisma/client'],
    // Windows dev fix: parallel jest-worker child processes crash on
    // larger pages (collection/category) with "Jest worker encountered
    // N child process exceptions". Forcing single-threaded compilation
    // avoids the crash. No effect on Vercel/Linux production builds.
    workerThreads: false,
    cpus: 1,
  },
  // Faster builds on Vercel
  swcMinify: true,
  // Strict mode causes double-render of every component in development,
  // doubling Supabase API calls during local testing. Disabled to keep
  // dev-mode timings accurate. Production behaviour is unaffected.
  reactStrictMode: false,
  // Compression handled by Vercel
  compress: true,
  // Powered by header
  poweredByHeader: false,
  async redirects() {
    const renamedProducts = Object.entries(productRenames).map(([from, to]) => ({
      source: `/product/${from}`,
      destination: `/product/${to}`,
      permanent: true,
    }));
    return [
      ...renamedProducts,
      // Old /printable/<slug> URLs: answered by the platform with a permanent redirect (no page render, no function call)
      { source: '/printable/:slug', destination: '/product/:slug', permanent: true },
      // Category renamed (typo fix): keep old URLs and their link equity
      { source: '/category/solor-system', destination: '/category/solar-system', permanent: true },
      { source: '/category/solor-system/page/:n', destination: '/category/solar-system/page/:n', permanent: true },
      { source: '/category/tridional-clothes', destination: '/category/traditional-clothes', permanent: true },
      { source: '/category/tridional-clothes/page/:n', destination: '/category/traditional-clothes/page/:n', permanent: true },
      // Dead links found by crawling the live site (blog posts still link to these): send them to the closest living page
      { source: '/category/printable-stickers', destination: '/category/stickers', permanent: true },
      { source: '/category/space-and-soler-system', destination: '/category/solar-system', permanent: true },
      { source: '/category/unicorns', destination: '/category/fantasy-magic', permanent: true },
      { source: '/product/cute-cat-sticker-pack-10-printable-kitten-designs-for-journals', destination: '/product/kawaii-cat-sticker-vault-100-printable-cute-cat-designs', permanent: true },
      { source: '/product/christmas-sticker-pack-20-cute-holiday-animal-santa-stickers', destination: '/product/christmas-sticker-vault-100-printable-holiday-designs-bundle', permanent: true },
      // Renamed to remove third-party character names
      { source: '/category/disney-characters', destination: '/category/cartoon-animal-friends', permanent: true },
      { source: '/category/disney-characters/page/:n', destination: '/category/cartoon-animal-friends/page/:n', permanent: true },
      { source: '/category/spider-man', destination: '/category/spider-hero', permanent: true },
      { source: '/category/spider-man/page/:n', destination: '/category/spider-hero/page/:n', permanent: true },
    ];
  },
  async headers() {
    const rules = [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Pages may only be framed by the same site (clickjacking protection)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
    // Brand images in public/brand are versioned by file name (change the name to change the image), so cache them for a year
    rules.push({
      source: '/brand/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    });
    // Cross-origin API access is off by default. To allow one specific site, set CORS_ORIGINS=https://that-site.com
    if (process.env.CORS_ORIGINS && process.env.CORS_ORIGINS !== '*') {
      rules.push({
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ORIGINS },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Vary', value: 'Origin' },
        ],
      });
    }
    return rules;
  },
};

module.exports = nextConfig;
