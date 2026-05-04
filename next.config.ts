import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-side secrets are never exposed to the client bundle.
  // All NEXT_PUBLIC_ vars are explicitly listed in .env.example.
};

export default nextConfig;
