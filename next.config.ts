import type { NextConfig } from "next";

const webOrigin = process.env.NEXT_PUBLIC_WEB_URL?.trim().replace(/\/$/, "");

const nextConfig: NextConfig = {
  async headers() {
    if (!webOrigin) return [];
    return [
      {
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' ${webOrigin}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
