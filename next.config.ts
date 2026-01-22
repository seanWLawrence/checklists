import { NextConfig } from "next";
import invariant from "tiny-invariant";
import { MAX_AUDIO_SIZE } from "./src/lib/upload.constants";

invariant(process.env.OPENAI_API_KEY, "Missing OPENAI_API_KEY");

// TODO: remove need for unsafe-inline for the PWA to work

const scriptSrcDevOnly =
  process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "";

const BLOB_HOSTNAME = process.env.BLOB_HOSTNAME;

invariant(BLOB_HOSTNAME, "BLOB_HOSTNAME must be set");
const BLOB_ORIGIN = new URL(BLOB_HOSTNAME).origin;

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' ${scriptSrcDevOnly};
    style-src 'self' 'unsafe-inline';
    img-src 'self' ${BLOB_ORIGIN};
    font-src 'self';
    connect-src 'self' ${BLOB_ORIGIN};
    frame-src 'none';
    object-src 'none';
    media-src 'self' ${BLOB_ORIGIN};
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

export default {
  experimental: {
    serverActions: {
      bodySizeLimit: MAX_AUDIO_SIZE,
    },
    proxyClientMaxBodySize: MAX_AUDIO_SIZE,
  },
  poweredByHeader: false,
  crossOrigin: "anonymous",
  serverExternalPackages: ["esbuild-wasm"],
  images: {
    remotePatterns: [new URL(BLOB_HOSTNAME)],
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
