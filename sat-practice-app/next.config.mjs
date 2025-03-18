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
};

export default nextConfig;
