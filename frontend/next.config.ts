import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode standalone pour déploiement Docker optimisé
  output: 'standalone',

  // Optimisations d'images
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
