import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Replaced 'domains' with 'remotePatterns' to address deprecation warning
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co', // For external placeholder images
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost', // For local Django development server
        port: '8000', // Specify the port Django runs on
        pathname: '/media/**', // Allow images from Django's media URL
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1', // Another local IP
        port: '8000', // Specify the port Django runs on
        pathname: '/media/**', // Allow images from Django's media URL
      },
      {
        protocol: 'https', // Assuming your ngrok URL is HTTPS
        hostname: 'man-fond-tortoise.ngrok-free.app', // Your Ngrok domain for Django
        port: '',
        pathname: '/media/**', // Allow images from Django's media URL
      },
      // Add your production Django media/CDN domain(s) here when deployed
      // {
      //   protocol: 'https',
      //   hostname: 'your-production-backend-domain.com',
      //   port: '',
      //   pathname: '/media/**',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.your-domain.com',
      //   port: '',
      //   pathname: '/**',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 's3.amazonaws.com', // Example if you use S3 for image hosting directly
      //   port: '',
      //   pathname: '/**',
      // },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/products/:path*',
        destination: 'http://localhost:8000/api/v1/products/:path*', // Proxy to Django backend
      },
    ]
  },
};

export default nextConfig;
