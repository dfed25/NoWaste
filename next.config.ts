import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack root to this app directory to avoid lockfile-based root guessing.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
