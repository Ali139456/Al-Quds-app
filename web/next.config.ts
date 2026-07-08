import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://al-quds-app-production.up.railway.app';
const apiHost = new URL(apiUrl).hostname;

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: apiHost, pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
