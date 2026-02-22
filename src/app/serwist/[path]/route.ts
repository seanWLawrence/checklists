import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

// Using `git rev-parse HEAD` might not the most efficient
// way of determining a revision. You may prefer to use
// the hashes of every extra file you precache.
const gitRevision = spawnSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf-8",
}).stdout?.trim();

const revision =
  process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
  (gitRevision && gitRevision.length > 0 ? gitRevision : undefined) ||
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/~offline", revision }],
    globPatterns: [],
    swSrc: "src/app/sw.ts",
    nextConfig: {},
  });
