import { Maybe } from "purify-ts";

export const BASE_URL = Maybe.fromNullable(
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
).mapOrDefault(
  (url) => new URL(`https://${url}`),
  new URL("http://localhost:3000"),
);
