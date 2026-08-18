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
