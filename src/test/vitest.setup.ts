import { vi } from "vitest";

const envDefaults = {
  NODE_ENV: "test",
  JOURNAL_VECTOR_MAX_DISTANCE: "0.9",
  JOURNAL_VECTOR_TOP_K: "40",
  MIN_JOURNAL_ANALYSIS_CHARS: "40",
  OPENAI_JOURNAL_ANALYSIS_MODEL: "gpt-4o-mini",
  LOG_LEVEL: "info",
  VERCEL_PROJECT_PRODUCTION_URL: "test.example.com",
  VERCEL_GIT_COMMIT_SHA: "test-sha",
  AWS_REGION: "us-east-1",
  AWS_ROLE_ARN: "arn:aws:iam::000000000000:role/test-role",
  AWS_ACCESS_KEY_ID: "test-access-key-id",
  AWS_SECRET_ACCESS_KEY: "test-secret-access-key",
  AWS_BUCKET_NAME: "test-bucket",
  AWS_JOURNAL_VECTOR_BUCKET_NAME: "test-vector-bucket",
  AWS_JOURNAL_VECTOR_INDEX_NAME: "test-vector-index",
  AWS_JOURNAL_VECTOR_DIMENSION: "1024",
  AWS_TABLE_NAME: "test-table",
  AWS_JOBS_QUEUE_URL: "https://sqs.us-east-1.amazonaws.com/000000000000/test-queue",
  ADMIN_USERNAMES: "test-admin",
  AUTH_SECRET: "test-auth-secret",
} as const;

for (const [key, value] of Object.entries(envDefaults)) {
  vi.stubEnv(key, value);
}

vi.mock("server-only", () => ({}));
