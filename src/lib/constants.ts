import { Maybe } from "purify-ts";

const MaybeDomain = Maybe.fromNullable(
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
);

const DEFAULT_DOMAIN = "localhost:3000";

export const DOMAIN = MaybeDomain.orDefault(DEFAULT_DOMAIN);

export const BASE_URL = MaybeDomain.mapOrDefault(
  (domain) => {
    return new URL(`https://${domain}`);
  },
  new URL(`http://${DEFAULT_DOMAIN}`),
);
