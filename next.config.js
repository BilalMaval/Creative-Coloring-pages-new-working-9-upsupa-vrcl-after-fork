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
    ],
    // Enable image optimization for Vercel
    unoptimized: false,
  },
  experimental: {
    // Vercel handles external packages automatically
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Faster builds on Vercel
  swcMinify: true,
  // Enable React strict mode for better development
  reactStrictMode: true,
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
