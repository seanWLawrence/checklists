import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants";
import serwist from "@serwist/next";
import { NextConfig } from "next";

// TODO: remove need for unsafe-inline for the PWA to work

const scriptSrcDevOnly =
  process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "";

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

const nextConfig: NextConfig = {
  poweredByHeader: false,
  crossOrigin: "anonymous",
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
};

const config = async (phase: string): Promise<NextConfig> => {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    const withSerwist = serwist({
      swSrc: "src/app/sw.ts",
      swDest: "public/sw.js",
    });
    return withSerwist(nextConfig);
  }

  return nextConfig;
};

export default config;
