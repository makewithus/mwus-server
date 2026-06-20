import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/ems",
  assetPrefix: "/ems",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "makewithus.in", "www.makewithus.in"],
    },
  },
};

export default nextConfig;
