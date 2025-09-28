import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ["src"],
  },
};

export default nextConfig;
