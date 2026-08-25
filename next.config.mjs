/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    // Increase server action / body payload limits if needed
    serverActions: {
      bodySizeLimit: '1gb',
    },
  },
};

export default nextConfig;
