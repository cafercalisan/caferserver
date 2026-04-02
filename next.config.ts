import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  serverExternalPackages: ["ssh2", "bcryptjs", "@google/genai"],
};

export default nextConfig;
