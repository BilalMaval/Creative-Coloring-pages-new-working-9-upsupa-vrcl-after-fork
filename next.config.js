/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel optimized - no standalone needed for Vercel
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'customer-assets.emergentagent.com',
      },
      {
        protocol: 'https',
        hostname: 'vfiyffogstwmeudvnasp.supabase.co',
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
    // Re-enabled per request for better UX (smaller/WebP images). NOTE:
    // Vercel's Hobby plan has a monthly Image Optimization quota — once
    // exceeded, ALL /_next/image requests 402 site-wide until it resets
    // (confirmed in production logs, this is what broke every icon at
    // once). Default Next.js generates 8 deviceSizes x 8 imageSizes = up
    // to 64 distinct variants per image, burning quota fast on a catalog
    // this size. Trimmed both lists below to the sizes actually used
    // (80px icons, ~256-640px product cards/galleries) to cut quota
    // consumption roughly 4x. If 402s return, check Vercel dashboard ->
    // Usage -> Image Optimization; the real fix at that point is
    // upgrading the plan, not more code changes.
    deviceSizes: [640, 768, 1080, 1920],
    imageSizes: [96, 128, 256, 384],
    unoptimized: false,
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
