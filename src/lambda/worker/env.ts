const getRequiredProcessEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing ${key}`);
  }

  return value;
};

const getPositiveIntegerProcessEnv = ({
  key,
  fallback,
}: {
  key: string;
  fallback: number;
}): number => {
  const raw = process.env[key];
  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

export const workerEnv = {
  AWS_REGION: getRequiredProcessEnv("AWS_REGION"),
  AWS_BUCKET_NAME: getRequiredProcessEnv("AWS_BUCKET_NAME"),
  AWS_TABLE_NAME: getRequiredProcessEnv("AWS_TABLE_NAME"),
  AWS_APP_SECRET_NAME: getRequiredProcessEnv("AWS_APP_SECRET_NAME"),
  OPENAI_AUDIO_TRANSCRIPTION_MODEL: getRequiredProcessEnv(
    "OPENAI_AUDIO_TRANSCRIPTION_MODEL",
  ),
  OPENAI_TRANSCRIPTION_STRUCTURING_MODEL: getRequiredProcessEnv(
    "OPENAI_TRANSCRIPTION_STRUCTURING_MODEL",
  ),
  MAX_RECEIVE_ATTEMPTS: getPositiveIntegerProcessEnv({
    key: "MAX_RECEIVE_ATTEMPTS",
    fallback: 3,
  }),
  TIMEOUT_IN_MIN: getPositiveIntegerProcessEnv({
    key: "TIMEOUT_IN_MIN",
    fallback: 10,
  }),
};
