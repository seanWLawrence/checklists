import { Either, Left, Right } from "purify-ts/Either";

export const parseSinceYear = (
  unsafeSince?: string,
): Either<unknown, string> => {
  const trimmed = unsafeSince?.trim();

  return trimmed?.match(/^\d{4}$/)
    ? Right(trimmed)
    : Left(`Invalid sinceYear '${unsafeSince}'`);
};
