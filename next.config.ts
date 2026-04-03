import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Always anchor Turbopack to this config file's directory.
  // This avoids bad module resolution when the shell cwd is outside the app root.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
