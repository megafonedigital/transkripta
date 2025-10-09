import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  async redirects() {
    return [
      { source: '/', destination: '/login', permanent: false },
    ];
  },
};

export default nextConfig;
