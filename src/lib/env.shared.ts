import { Maybe } from "purify-ts";
import {
  getOptionalEnv,
} from "@/lib/env.helpers";

// Runtime
export const NODE_ENV = getOptionalEnv({ key: "NODE_ENV" }) ?? "development";
export const IS_PRODUCTION = NODE_ENV === "production";
export type AppEnvironment = "dev" | "prod";

export const getAppEnvironment = (): AppEnvironment => {
  return IS_PRODUCTION ? "prod" : "dev";
};

export const isProduction = () => getAppEnvironment() === "prod";

// Journal config
export const JOURNAL_VECTOR_MAX_DISTANCE = (() => {
  const raw = getOptionalEnv({ key: "JOURNAL_VECTOR_MAX_DISTANCE" });
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return 0.9;
  }

  return Math.max(0, Math.min(2, parsed));
})();

export const JOURNAL_VECTOR_TOP_K = (() => {
  const raw = getOptionalEnv({ key: "JOURNAL_VECTOR_TOP_K" });
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return 40;
  }

  return Math.max(1, Math.min(100, Math.floor(parsed)));
})();

export const MIN_JOURNAL_ANALYSIS_CHARS = (() => {
  const raw = getOptionalEnv({ key: "MIN_JOURNAL_ANALYSIS_CHARS" });
  const parsed = Number(raw ?? 40);

  if (!Number.isFinite(parsed)) {
    return 40;
  }

  return Math.max(0, Math.floor(parsed));
})();

// OpenAI (non-secret config)
export const OPENAI_JOURNAL_ANALYSIS_MODEL =
  getOptionalEnv({ key: "OPENAI_JOURNAL_ANALYSIS_MODEL" }) ?? "gpt-4o-mini";

// Logger
export const LOG_LEVEL =
  getOptionalEnv({ key: "LOG_LEVEL" })?.toLocaleLowerCase() ?? "info";

// URLs
const VERCEL_PROJECT_PRODUCTION_URL = getOptionalEnv({
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
  getOptionalEnv({ key: "VERCEL_GIT_COMMIT_SHA" })?.trim() || undefined;

// Auth constants
const MILLISECONDS_IN_A_SECOND = 1000;
const SECONDS_IN_A_MINUTE = 60;
const SECONDS_IN_A_DAY = 24 * 60 * 60;

export const FIFTEEN_MINUTES_IN_MILLISECONDS =
  15 * MILLISECONDS_IN_A_SECOND * SECONDS_IN_A_MINUTE;

export const THIRTY_DAYS_IN_SECONDS = 30 * SECONDS_IN_A_DAY;

export const THIRTY_DAYS_IN_MILLISECONDS = THIRTY_DAYS_IN_SECONDS * 1000;

export const JWT_ALGORITHM = "HS256";

export const ACCESS_JWT_COOKIE_NAME = IS_PRODUCTION ? "__Host-session" : "session";

export const REFRESH_TOKEN_COOKIE_NAME = IS_PRODUCTION ? "__Host-refresh" : "refresh";

export const AUD = Maybe.fromNullable(VERCEL_PROJECT_PRODUCTION_URL);

export const ISS = Maybe.fromNullable(VERCEL_PROJECT_PRODUCTION_URL);
