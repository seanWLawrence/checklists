import { Maybe } from "purify-ts";

export const AUTH_COOKIE_NAME = Maybe.fromNullable(
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
)
  .map(() => "__Host-session")
  // Localhost doesn't work with Host__ prefix
  .orDefault("session");
