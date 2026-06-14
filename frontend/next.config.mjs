import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hide the Next.js dev overlay button in the preview.
  devIndicators: false,
  // Pin the workspace root so Turbopack doesn't pick the parent /app/yarn.lock.
  turbopack: { root: __dirname },
  // Allow the Emergent preview host to load dev assets without cross-origin warnings.
  allowedDevOrigins: [
    "miss-sc-logistics.preview.emergentagent.com",
    "*.preview.emergentagent.com",
    "miss-sc-logistics.cluster-5.preview.emergentcf.cloud",
    "*.preview.emergentcf.cloud",
  ],
};

export default nextConfig;
