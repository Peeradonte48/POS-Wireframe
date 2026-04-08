import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'www.figma.com' },
      { protocol: 'https', hostname: 'cdn.a-ramen.com' },
      { protocol: 'https', hostname: 'aramen-locationcms.s3.ap-southeast-1.amazonaws.com' },
    ],
  },
};

export default nextConfig;
