const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Static Blossom domains configuration (avoid TypeScript import issues in next.config.js)
const getAllBlossomDomains = () => {
  return [
    '*.blossom.band',     // User-owned Blossom servers
    '*.blosstr.com',      // Alternative user-owned servers
    'blossom.nostr.build', // Shared Blossom server
    'blosstr.com',        // Alternative shared server
  ];
};

/** @type {import('next').NextConfig} */
const baseConfig = {
  // experimental options removed to fix Next.js config warning
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '**',
      },
      // Dynamic Blossom domains from configuration
      ...getAllBlossomDomains().map(hostname => ({
        protocol: 'https',
        hostname,
        pathname: '**',
      })),
      // Legacy image hosts
      {
        protocol: 'https',
        hostname: 'image.nostr.build',
        pathname: '**',
      },
    ],
  },
  // Re-enable ESLint during builds now that cleanup is in progress.
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Exclude temp-cb-reference and temp-formstr-reference from compilation
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/temp-cb-reference/**', '**/temp-formstr-reference/**', '**/node_modules/**'],
    };
    return config;
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  experimental: {
    externalDir: false,
  },
};
module.exports = withBundleAnalyzer(baseConfig);
