import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Linting is not part of the deployed build; `npm run typecheck` covers types.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
