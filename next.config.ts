import { NextConfig } from "next";
import invariant from "@/lib/invariant";
import { RemotePattern } from "next/dist/shared/lib/image-config";

invariant(process.env.OPENAI_API_KEY, "Missing OPENAI_API_KEY");
invariant(process.env.AWS_BUCKET_NAME, "Missing AWS_BUCKET_NAME");
invariant(process.env.AWS_REGION, "Missing AWS_REGION");
invariant(
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  "Missing VERCEL_PROJECT_PRODUCTION_URL",
);

// TODO: remove need for unsafe-inline for the PWA to work

const scriptSrcDevOnly =
  process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "";

const S3_BUCKET_HOSTNAME = `${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
const S3_BUCKET_ORIGIN = `https://${S3_BUCKET_HOSTNAME}`;

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' ${scriptSrcDevOnly};
    style-src 'self' 'unsafe-inline';
    img-src 'self' ${S3_BUCKET_ORIGIN};
    font-src 'self';
    connect-src 'self' ${S3_BUCKET_ORIGIN};
    frame-src 'none';
    object-src 'none';
    media-src 'self' ${S3_BUCKET_ORIGIN} blob:;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

const remotePatterns: RemotePattern[] = [
  {
    protocol: "https",
    hostname: S3_BUCKET_HOSTNAME,
    port: "",
    pathname: `/**`,
  },
];

export default {
  poweredByHeader: false,
  crossOrigin: "anonymous",
  serverExternalPackages: ["esbuild-wasm"],
  images: {
    remotePatterns,
    unoptimized: process.env.NODE_ENV === "development",
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

    if (process.env.NODE_ENV === "production") {
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
