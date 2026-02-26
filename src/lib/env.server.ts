import "server-only";

import { Maybe } from "purify-ts";
import invariant from "./invariant";

const getRequired = ({ key }: { key: string }): string => {
  const value = process.env[key];

  invariant(value, () => `Missing required env variable: ${key}`);

  return value;
};

const getOptional = ({ key }: { key: string }): string | undefined => {
  return process.env[key];
};

const parseRequiredNumber = ({
  key,
  value,
}: {
  key: string;
  value: string;
}): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${key} must be a valid number`);
  }

  return parsed;
};

// Runtime
export const NODE_ENV = getOptional({ key: "NODE_ENV" }) ?? "development";
export const IS_PRODUCTION = NODE_ENV === "production";
export type AppEnvironment = "dev" | "prod";

export const getAppEnvironment = (): AppEnvironment => {
  return IS_PRODUCTION ? "prod" : "dev";
};

// Journal config
export const JOURNAL_VECTOR_MAX_DISTANCE = (() => {
  const raw = getOptional({ key: "JOURNAL_VECTOR_MAX_DISTANCE" });
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return 0.9;
  }

  return Math.max(0, Math.min(2, parsed));
})();

export const JOURNAL_VECTOR_TOP_K = (() => {
  const raw = getOptional({ key: "JOURNAL_VECTOR_TOP_K" });
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return 40;
  }

  return Math.max(1, Math.min(100, Math.floor(parsed)));
})();

export const MIN_JOURNAL_ANALYSIS_CHARS = (() => {
  const raw = getOptional({ key: "MIN_JOURNAL_ANALYSIS_CHARS" });
  const parsed = Number(raw ?? 40);

  if (!Number.isFinite(parsed)) {
    return 40;
  }

  return Math.max(0, Math.floor(parsed));
})();

export const isProduction = () => getAppEnvironment() === "prod";

// AWS
export const AWS_ROLE_SESSION_NAME = "checklists-session";
export const AWS_ROLE_DURATION_SECONDS = 900;
export const AWS_REGION = getRequired({ key: "AWS_REGION" });
export const AWS_ROLE_ARN = getRequired({ key: "AWS_ROLE_ARN" });
export const AWS_ACCESS_KEY_ID = getRequired({
  key: "AWS_ACCESS_KEY_ID",
});
export const AWS_SECRET_ACCESS_KEY = getRequired({
  key: "AWS_SECRET_ACCESS_KEY",
});
export const AWS_BUCKET_NAME = getRequired({ key: "AWS_BUCKET_NAME" });
export const AWS_JOURNAL_VECTOR_BUCKET_NAME = getRequired({
  key: "AWS_JOURNAL_VECTOR_BUCKET_NAME",
});
export const AWS_JOURNAL_VECTOR_INDEX_NAME = getRequired({
  key: "AWS_JOURNAL_VECTOR_INDEX_NAME",
});
export const AWS_ENDPOINT = IS_PRODUCTION ? undefined : "http://localhost:9000";
export const AWS_JOURNAL_VECTOR_DIMENSION = parseRequiredNumber({
  key: "AWS_JOURNAL_VECTOR_DIMENSION",
  value: getRequired({ key: "AWS_JOURNAL_VECTOR_DIMENSION" }),
});

// Open AI
export const OPENAI_JOURNAL_TRANSCRIPTION_MODEL =
  getOptional({ key: "OPENAI_JOURNAL_TRANSCRIPTION_MODEL" }) ?? "gpt-4o-mini";

export const OPENAI_JOURNAL_ANALYSIS_MODEL =
  getOptional({ key: "OPENAI_JOURNAL_ANALYSIS_MODEL" }) ?? "gpt-4o-mini";

// Logger
export const LOG_LEVEL =
  getOptional({ key: "LOG_LEVEL" })?.toLocaleLowerCase() ?? "info";

// URLs
const VERCEL_PROJECT_PRODUCTION_URL = getOptional({
  key: "VERCEL_PROJECT_PRODUCTION_URL",
});

export const DOMAIN =
  IS_PRODUCTION && VERCEL_PROJECT_PRODUCTION_URL
    ? VERCEL_PROJECT_PRODUCTION_URL
    : "localhost:3000";

export const BASE_URL = new URL(
  `${IS_PRODUCTION ? "https" : "http"}://${DOMAIN}`,
);

export const VERCEL_GIT_COMMIT_SHA =
  getOptional({ key: "VERCEL_GIT_COMMIT_SHA" })?.trim() || undefined;

// Auth constants
const MILLISECONDS_IN_A_SECOND = 1000;
const SECONDS_IN_A_MINUTE = 60;
const SECONDS_IN_A_DAY = 24 * 60 * 60;

export const FIFTEEN_MINUTES_IN_MILLISECONDS =
  15 * MILLISECONDS_IN_A_SECOND * SECONDS_IN_A_MINUTE;

export const THIRTY_DAYS_IN_SECONDS = 30 * SECONDS_IN_A_DAY;

export const THIRTY_DAYS_IN_MILLISECONDS = THIRTY_DAYS_IN_SECONDS * 1000;

export const JWT_ALGORITHM = "HS256";

export const ACCESS_JWT_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-session"
  : // Localhost doesn't work with Host__ prefix
    "session";

export const REFRESH_TOKEN_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-refresh"
  : // Localhost doesn't work with Host__ prefix
    "refresh";

export const AUD = Maybe.fromNullable(VERCEL_PROJECT_PRODUCTION_URL);

export const ISS = Maybe.fromNullable(VERCEL_PROJECT_PRODUCTION_URL);

export const ADMIN_USERNAMES = (getOptional({ key: "ADMIN_USERNAMES" }) ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

export const AUTH_SECRET = getRequired({ key: "AUTH_SECRET" });
