import "server-only";

import { Maybe } from "purify-ts/Maybe";
import { isProduction } from "./environment";

export const AWS_ROLE_SESSION_NAME = "checklists-session";

// Minimum required
export const AWS_ROLE_DURATION_SECONDS = 900;

export const AWS_REGION = Maybe.fromNullable(process.env.AWS_REGION).toEither(
  "Missing AWS_REGION",
);

export const AWS_ROLE_ARN = Maybe.fromNullable(
  process.env.AWS_ROLE_ARN,
).toEither("Missing AWS_ROLE_ARN");

export const AWS_ACCESS_KEY_ID = Maybe.fromNullable(
  process.env.AWS_ACCESS_KEY_ID,
).toEither("Missing AWS_ACCESS_KEY_ID");

export const AWS_SECRET_ACCESS_KEY = Maybe.fromNullable(
  process.env.AWS_SECRET_ACCESS_KEY,
).toEither("Missing AWS_SECRET_ACCESS_KEY");

export const AWS_BUCKET_NAME = Maybe.fromNullable(
  process.env.AWS_BUCKET_NAME,
).toEither("Missing AWS_BUCKET_NAME");

// Local MiniIO endpoint for non-production environments
export const AWS_ENDPOINT = isProduction()
  ? undefined
  : "http://localhost:9000";

export const AUTH_SECRET = Maybe.fromNullable(process.env.AUTH_SECRET).toEither(
  "Missing AUTH_SECRET environment variable",
);
