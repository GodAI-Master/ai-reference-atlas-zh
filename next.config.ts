import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` is for the self-hosted Docker path (see Dockerfile). Vercel builds
  // its own output layout and expects the default, so only opt in off-platform.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
