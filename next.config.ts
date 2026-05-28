import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export is ONLY for `pages:build` — regular dev uses server mode
  // so API routes and edge runtime work in dev.
  // For CF Pages deployment, @cloudflare/next-on-pages handles the build.
  images: { unoptimized: true },
  // Allow Tailscale hostname access in dev
  allowedDevOrigins: ['kobold-pi.oryx-avior.ts.net:3000'],
};

export default nextConfig;