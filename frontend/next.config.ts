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
      { protocol: "https", hostname: "two4ghanta.onrender.com" },
      { protocol: "https", hostname: "img.republicworld.com" },
      ...(apiPattern ? [apiPattern] : []),
    ],
    // Next.js 16 blocks optimizer fetches whose DNS resolves to a private IP
    // (SSRF protection). The local backend at localhost:5000 falls into that
    // bucket, so allow it only in development.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
  turbopack: {
    root: __dirname,
  },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
};

export default nextConfig;
