import { Either } from "purify-ts/Either";
import { Maybe } from "purify-ts/Maybe";
import invariant from "tiny-invariant";

const MILLISECONDS_IN_A_SECOND = 1000;
const SECONDS_IN_A_MINUTE = 60;

export const FIFTEEN_MINUTES_IN_MILLISECONDS =
  15 * MILLISECONDS_IN_A_SECOND * SECONDS_IN_A_MINUTE;

const SECONDS_IN_A_DAY = 24 * 60 * 60;
export const THIRTY_DAYS_IN_SECONDS = 30 * SECONDS_IN_A_DAY;

export const THIRTY_DAYS_IN_MILLISECONDS = THIRTY_DAYS_IN_SECONDS * 1000;

export const JWT_ALGORITHM = "HS256";

export const ACCESS_JWT_COOKIE_NAME = Maybe.fromNullable(
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
)
  .map(() => "__Host-session")
  // Localhost doesn't work with Host__ prefix
  .orDefault("session");

export const REFRESH_TOKEN_COOKIE_NAME = Maybe.fromNullable(
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
)
  .map(() => "__Host-refresh")
  // Localhost doesn't work with Host__ prefix
  .orDefault("refresh");

export const AUTH_SECRET = Either.encase(() => {
  const authSecret = process.env.AUTH_SECRET;

  invariant(authSecret, "Missing AUTH_SECRET environment variable");

  return authSecret;
});

export const AUD = Maybe.fromNullable(
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
);

export const ISS = Maybe.fromNullable(
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
);
