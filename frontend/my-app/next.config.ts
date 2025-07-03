// frontend/my-app/next.config.ts

import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

// Enable bundle analyzer with ANALYZE=true npm run build
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = bundleAnalyzer({
  images: {
    // remotePatterns for optimized image domains
    // This is the correct and modern way to configure image domains in Next.js 13+
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
      // IMPORTANT: Add your S3 bucket domain here once your backend is deployed
      // Example:
      // {
      //   protocol: 'https',
      //   hostname: 'ltronix-shop-bucket.s3.eu-north-1.amazonaws.com', // Replace with your actual S3 bucket domain
      //   port: '',
      //   pathname: '/**',
      // },
      // Add your Render backend domain here if images are proxied through it
      // {
      //   protocol: 'https',
      //   hostname: 'your-render-backend-domain.render.com',
      //   port: '',
      //   pathname: '/media/**', // Or whatever path your backend uses for media
      // },
    ],
  },
  // Speed up dev and build by ignoring type errors (optional: set to false if you want strict builds)
  typescript: {
    ignoreBuildErrors: false
  },
  // swcMinify is true by default in Next.js 12.2.0 and later, so this option is no longer needed.
  // It has been removed to resolve the "Unrecognized key(s) in object: 'swcMinify'" warning.
  // swcMinify: true, // REMOVED THIS LINE

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*', // Catch all API paths
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/:path*`, // Use env var for backend URL
      },
    ];
  },
  // The 'appDir' feature is no longer experimental in Next.js 13.4+ and later versions.
  // The 'experimental' block is removed to resolve the "Unrecognized key(s) in object: 'appDir' at 'experimental'" warning.
  // experimental: {
  //   appDir: true // REMOVED THIS BLOCK
  // },
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

