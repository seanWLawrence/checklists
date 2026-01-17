import "server-only";
import { Either } from "purify-ts";
import { createHash } from "crypto";

export const secureHashSha256 = (value: string): Either<unknown, string> => {
  return Either.encase(() => {
    return createHash("sha256").update(value).digest("hex");
  });
};
