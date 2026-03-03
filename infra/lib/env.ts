import { config } from "@dotenvx/dotenvx";
import invariant from "tiny-invariant";

config({ strict: false, ignore: ["MISSING_ENV_FILE"] });

const getRequired = (key: string): string => {
  const value = process.env[key];

  invariant(value, () => `Missing required env variable: ${key}`);

  return value;
};

// App
export const BASE_URL = getRequired("BASE_URL");

// Third-party services
export const OPENAI_API_KEY = getRequired("OPENAI_API_KEY");
export const OPENAI_TRANSCRIPTION_MODEL = getRequired(
  "OPENAI_TRANSCRIPTION_MODEL",
);
export const OPENAI_TRANSCRIPTION_STRUCTURING_MODEL = getRequired(
  "OPENAI_TRANSCRIPTION_STRUCTURING_MODEL",
);

// AWS
export const AWS_ACCOUNT = getRequired("AWS_ACCOUNT");
export const AWS_REGION = getRequired("AWS_REGION");
export const AWS_ALARM_EMAIL = getRequired("AWS_ALARM_EMAIL");
export const AWS_JOURNAL_VECTOR_DIMENSION = getRequired(
  "AWS_JOURNAL_VECTOR_DIMENSION",
);
