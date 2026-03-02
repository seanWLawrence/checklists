export const toWorkerErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export const isConditionalCheckFailure = (error: unknown): boolean => {
  const name =
    error instanceof Error && typeof error.name === "string" ? error.name : "";
  const message = toWorkerErrorMessage(error).toLowerCase();

  if (name === "ConditionalCheckFailedException") {
    return true;
  }

  return (
    name === "TransactionCanceledException" && message.includes("conditional")
  );
};

export const isTransientWorkerError = (error: unknown): boolean => {
  const message = toWorkerErrorMessage(error).toLowerCase();

  return [
    "rate limit",
    "429",
    "timeout",
    "timed out",
    "econnreset",
    "etimedout",
    "socket hang up",
    "network",
    "fetch failed",
    "service unavailable",
    "502",
    "503",
    "504",
    "overloaded",
  ].some((needle) => message.includes(needle));
};
