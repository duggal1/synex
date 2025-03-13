import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "farmui.vercel.app",
        pathname: "/dashboard.png",
      },
      {
        protocol: "https",
        hostname: "randomuser.me", // remove "https://"
        pathname: "/api/portraits/**", // allows any image under this path
      },
    ],
  },
};

export default nextConfig;
