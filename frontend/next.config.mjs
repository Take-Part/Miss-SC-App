import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so Turbopack doesn't pick the parent /app/yarn.lock.
  turbopack: { root: __dirname },
  // Allow the Emergent preview host to load dev assets without cross-origin warnings.
  allowedDevOrigins: [
    "miss-sc-logistics.preview.emergentagent.com",
    "*.preview.emergentagent.com",
  ],
};

export default nextConfig;
