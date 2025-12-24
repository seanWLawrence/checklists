import { NextConfig } from "next";
import invariant from "tiny-invariant";

// TODO: remove need for unsafe-inline for the PWA to work

const scriptSrcDevOnly =
  process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "";

const IMAGE_HOSTNAME = process.env.IMAGE_HOSTNAME;

invariant(IMAGE_HOSTNAME, "IMAGE_HOSTNAME must be set");

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' ${scriptSrcDevOnly};
    style-src 'self' 'unsafe-inline';
    img-src 'self';
    font-src 'self';
    connect-src 'self';
    frame-src 'none';
    object-src 'none';
    media-src 'self';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

export default {
  poweredByHeader: false,
  crossOrigin: "anonymous",
  serverExternalPackages: ["esbuild-wasm"],
  images: {
    remotePatterns: [new URL(IMAGE_HOSTNAME)],
  },
  async headers() {
    const headers = [
      { key: "x-Frame-Options", value: "DENY" },
      { key: "x-Content-Type-Options", value: "nosniff" },
      { key: "Access-Control-Allow-Methods", value: "GET, POST" },
      // None
      { key: "Access-Control-Allow-Headers", value: "" },
      { key: "Access-Control-Allow-Max-Age", value: "31536000" },
      { key: "Referrer-Policy", value: "no-referrer" },
      // One year
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
    ];

    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      headers.push({
        key: "Access-Control-Allow-Origin",
        value: `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
      });
    }

    if (process.env.NODE_ENV !== "development") {
      headers.push({
        key: "Content-Security-Policy",
        value: cspHeader.replace(/\n/g, ""),
      });
    }

    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
} satisfies NextConfig;
