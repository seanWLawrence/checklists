import "server-only";
import { Either, Left, Right } from "purify-ts/Either";
import { Maybe } from "purify-ts/Maybe";
import { logger } from "../logger";

interface ValidateAudParams {
  expectedAudMaybe: Maybe<string>;
  actualAud?: string | string[];
}

export const validateAud = ({
  expectedAudMaybe,
  actualAud,
}: ValidateAudParams): Either<string, string> => {
  logger.debug("Validating aud claim");

  if (expectedAudMaybe.isNothing()) {
    return Right(expectedAudMaybe.extract());
  }

  const expectedAud = expectedAudMaybe.extract();

  if (Array.isArray(actualAud)) {
    return Left("Invalid aud");
  }

  if (actualAud && expectedAud === actualAud) {
    return Right(actualAud);
  }

  return Left("Invalid aud");
};
