import invariant from "@/lib/invariant";

export const getRequiredEnv = ({ key }: { key: string }): string => {
  const value = process.env[key];

  invariant(value, () => `Missing required env variable: ${key}`);

  return value;
};

export const getOptionalEnv = ({ key }: { key: string }): string | undefined => {
  return process.env[key];
};

export const parseRequiredNumberEnv = ({
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
