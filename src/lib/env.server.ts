import "@nobush/server-only";

import {
  getOptionalEnv,
  getRequiredEnv,
  parseRequiredNumberEnv,
} from "@/lib/env.helpers";

export * from "@/lib/env.shared";

// AWS
export const AWS_ROLE_SESSION_NAME = "checklists-session";
export const AWS_ROLE_DURATION_SECONDS = 900;
export const AWS_REGION = getRequiredEnv({ key: "AWS_REGION" });
export const AWS_ROLE_ARN = getRequiredEnv({ key: "AWS_ROLE_ARN" });
export const AWS_ACCESS_KEY_ID = getRequiredEnv({
  key: "AWS_ACCESS_KEY_ID",
});
export const AWS_SECRET_ACCESS_KEY = getRequiredEnv({
  key: "AWS_SECRET_ACCESS_KEY",
});
export const AWS_BUCKET_NAME = getRequiredEnv({ key: "AWS_BUCKET_NAME" });
export const AWS_JOURNAL_VECTOR_BUCKET_NAME = getRequiredEnv({
  key: "AWS_JOURNAL_VECTOR_BUCKET_NAME",
});
export const AWS_JOURNAL_VECTOR_INDEX_NAME = getRequiredEnv({
  key: "AWS_JOURNAL_VECTOR_INDEX_NAME",
});
export const AWS_JOURNAL_VECTOR_DIMENSION = parseRequiredNumberEnv({
  key: "AWS_JOURNAL_VECTOR_DIMENSION",
  value: getRequiredEnv({ key: "AWS_JOURNAL_VECTOR_DIMENSION" }),
});
export const AWS_TABLE_NAME = getRequiredEnv({ key: "AWS_TABLE_NAME" });
export const AWS_JOBS_QUEUE_URL = getRequiredEnv({
  key: "AWS_JOBS_QUEUE_URL",
});

// Server-only auth/admin values
export const ADMIN_USERNAMES = (
  getOptionalEnv({ key: "ADMIN_USERNAMES" }) ?? ""
)
  .split(",")
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

export const AUTH_SECRET = getRequiredEnv({ key: "AUTH_SECRET" });
