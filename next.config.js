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
    // Vercel's Hobby plan caps monthly Image Optimization usage; once
    // exceeded, ALL /_next/image requests return 402 Payment Required
    // site-wide (confirmed in production logs). unoptimized:true serves
    // original image URLs directly, bypassing that paid quota entirely.
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
