/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure static asset handling for the landing page
  reactStrictMode: true,
  // Ensures that static files in public directory are properly served
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // Completely ignore ESLint errors during build
    // OR use the more targeted approach:
    // ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  // Required for Stripe webhook processing to get raw body
  api: {
    bodyParser: false,
  },
  async rewrites() {
    return [
      // Handle password reset tokens on welcome page
      {
        source: '/welcome',
        destination: '/auth/handle-auth',
        has: [
          {
            type: 'query',
            key: 'type',
            value: 'recovery',
          },
        ],
      },
      // The welcome page will be the static landing page
      {
        source: '/welcome',
        destination: '/index.html',
      },
      // Legacy support for landing path
      {
        source: '/landing',
        destination: '/index.html',
      }
    ]
  },
};

export default nextConfig;
