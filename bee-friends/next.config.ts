import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "export",
  basePath: "/game",
  assetPrefix: "/game",
};

export default nextConfig;
