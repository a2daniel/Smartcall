import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs']
  },
  // Disable custom server for Vercel deployment
  ...(process.env.VERCEL ? {} : {
    // Custom server only for local development
  })
};

export default nextConfig;
