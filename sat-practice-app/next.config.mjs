/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure static asset handling for the landing page
  reactStrictMode: true,
  // Ensures that static files in public directory are properly served
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
