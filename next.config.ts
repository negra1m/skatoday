import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      { source: "/amigos", destination: "/bros", permanent: true },
      { source: "/amigos/:path*", destination: "/bros/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
