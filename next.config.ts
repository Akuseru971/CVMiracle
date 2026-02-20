import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  serverExternalPackages: ["pdf-parse", "pdfkit", "mammoth"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://accounts.google.com; connect-src 'self' https://api.openai.com https://api.stripe.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
