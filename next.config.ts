import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Product media is served from the local, permission-checked media route.
  // No remote image hosts are trusted by default.
  images: { remotePatterns: [] },
  experimental: {
    serverActions: { bodySizeLimit: '12mb' },
  },
};

export default nextConfig;
