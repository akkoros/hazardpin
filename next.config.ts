import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  serverExternalPackages: ['sql.js'],
  allowedDevOrigins: [
    'kobold-pi:3000',
    'http://kobold-pi:3000',
    'kobold-pi.oryx-avior.ts.net:9443',
    'kobold-pi.oryx-avior.ts.net:9444',
    'http://kobold-pi.oryx-avior.ts.net:3000',
    'https://kobold-pi.oryx-avior.ts.net:9444',
  ],
};

export default nextConfig;