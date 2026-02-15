import { Maybe } from "purify-ts";

export const DOMAIN = Maybe.fromFalsy(process.env.NODE_ENV === "production")
  .chain(() => Maybe.fromNullable(process.env.VERCEL_PROJECT_PRODUCTION_URL))
  .orDefault("localhost:3000");

export const BASE_URL = Maybe.fromFalsy(
  process.env.NODE_ENV === "production",
).mapOrDefault(
  () => {
    return new URL(`https://${DOMAIN}`);
  },
  new URL(`http://${DOMAIN}`),
);
