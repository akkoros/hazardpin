import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  allowedDevOrigins: [
    'kobold-pi:3000',
    'kobold-pi.oryx-avior.ts.net:3000',
  ],
};

export default nextConfig;