import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  serverExternalDependencies: ['sql.js'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Make sql.js a external module so it's loaded via require() at runtime
      // instead of being bundled by webpack (which breaks WASM loading)
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push('sql.js')
      }
    }
    return config
  },
  allowedDevOrigins: [
    'kobold-pi:3000',
    'http://kobold-pi:3000',
    'kobold-pi.oryx-avior.ts.net:9443',
    'http://kobold-pi.oryx-avior.ts.net:3000',
  ],
};

export default nextConfig;