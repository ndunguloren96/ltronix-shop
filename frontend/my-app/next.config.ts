import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

// Enable bundle analyzer with ANALYZE=true npm run build
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = bundleAnalyzer({
  images: {
    // remotePatterns for optimized image domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'man-fond-tortoise.ngrok-free.app',
        port: '',
        pathname: '/media/**',
      },
      // Add more production/CDN domains as needed
    ],
  },
  // Speed up dev and build by ignoring type errors (optional: set to false if you want strict builds)
  typescript: {
    ignoreBuildErrors: false
  },
  // SWC minification is on by default in Next.js 13+
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/products/:path*',
        destination: 'http://localhost:8000/api/v1/products/:path*',
      },
    ]
  },
  // Enable experimental features if needed (appDir, etc)
  experimental: {
    appDir: true
  },
  webpack(config, { isServer }) {
    // Suppress OpenTelemetry/Sentry dynamic require warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    return config;
  },
});

export default nextConfig;
