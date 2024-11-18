import { Either, Left, Right } from "purify-ts/Either";
import { logger } from "../logger";

export interface ValidateIssuedAtParams {
  iat?: number;
  maxValidMilliIssuedFromNow: number;
}

export const validateIssuedAt = ({
  iat,
  maxValidMilliIssuedFromNow,
}: ValidateIssuedAtParams): Either<string, number> => {
  logger.debug("Validating iat claim");

  if (!iat) {
    return Left("No iat");
  }

  // Hasn't been isssued more than 15 minutes ago
  const remainingTimeUntilExpiration = Date.now() - iat;

  if (remainingTimeUntilExpiration > maxValidMilliIssuedFromNow) {
    return Left("iat issued longer ago than expected");
  }

  return Right(iat);
};
