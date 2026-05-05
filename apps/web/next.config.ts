import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@attendance-tracker/shared-types',
    '@attendance-tracker/config',
    '@attendance-tracker/utils',
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  typedRoutes: true,
};

export default nextConfig;
