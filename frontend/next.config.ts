import type { NextConfig } from "next";

let backendDomain = "";
try {
  if (process.env.NEXT_PUBLIC_API_URL) {
    backendDomain = new URL(process.env.NEXT_PUBLIC_API_URL).origin;
  }
} catch (e) {
  // Ignore invalid URL
}

const cspHeader = `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://vercel.live https://vercel.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://*.supabase.co https://vercel.com https://vercel.live; font-src 'self' data: https://fonts.gstatic.com https://assets.vercel.com https://frontend-cdn.perplexity.ai https://*.perplexity.ai; connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://vercel.live wss://*.vercel.live${backendDomain ? ' ' + backendDomain : ''}; frame-src 'self' https://challenges.cloudflare.com https://vercel.live;`;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default nextConfig;

