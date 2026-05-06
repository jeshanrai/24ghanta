import type { NextConfig } from "next";

// Build a remotePattern for the API origin so /uploads/<file> served by the
// backend is allowed through next/image. NEXT_PUBLIC_API_URL must be set at
// build time (Vercel env var) for production.
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function apiRemotePattern() {
  try {
    const u = new URL(apiUrl);
    return {
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      port: u.port || undefined,
      pathname: "/uploads/**",
    };
  } catch {
    return null;
  }
}

const apiPattern = apiRemotePattern();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      ...(apiPattern ? [apiPattern] : []),
    ],
  },
  turbopack: {
    root: __dirname,
  },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
};

export default nextConfig;
