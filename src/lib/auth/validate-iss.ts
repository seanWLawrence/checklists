import "server-only";
import { Either, Left, Right } from "purify-ts/Either";
import { Maybe } from "purify-ts/Maybe";
import { logger } from "../logger";

interface ValidateIssParams {
  expectedIssMaybe: Maybe<string>;
  actualIss?: string | string[];
}

export const validateIss = ({
  expectedIssMaybe,
  actualIss,
}: ValidateIssParams): Either<string, string> => {
  logger.debug("Validating iss claim");

  if (expectedIssMaybe.isNothing()) {
    return Right(expectedIssMaybe.extract());
  }

  const expectedIss = expectedIssMaybe.extract();

  if (Array.isArray(actualIss)) {
    return Left("Invalid iss");
  }

  if (actualIss && expectedIss === actualIss) {
    return Right(actualIss);
  }

  return Left("Invalid iss");
};
