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

const S3_BUCKET_HOSTNAME = `${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

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
    const securityHeaders = [
      { key: "x-Frame-Options", value: "DENY" },
      { key: "x-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
      {
        // Defense-in-depth: explicitly disable browser capabilities this app does not use.
        // Keep camera/microphone enabled for same-origin use only.
        key: "Permissions-Policy",
        value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()",
      },
      // Enforce HTTPS for this host and any future subdomains under it.
      // Add `preload` only after confirming the whole registrable domain is ready.
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
} satisfies NextConfig;
