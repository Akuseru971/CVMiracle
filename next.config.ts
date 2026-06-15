import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local images live in /public/images. Remote WMF domains are allowed as a
    // fallback in case any asset is referenced directly from the official CDNs.
    remotePatterns: [
      { protocol: "https", hostname: "www.wmf.com" },
      { protocol: "https", hostname: "www.wmf.co.jp" },
      { protocol: "https", hostname: "ac-static.api.everforth.com" },
    ],
  },
};

export default nextConfig;
