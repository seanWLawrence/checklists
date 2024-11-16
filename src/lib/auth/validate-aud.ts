import { Either, Left, Right } from "purify-ts/Either";
import { Maybe } from "purify-ts/Maybe";

export interface ValidateAudParams {
  expectedAudMaybe: Maybe<string>;
  actualAud?: string | string[];
}

export const validateAud = ({
  expectedAudMaybe,
  actualAud,
}: ValidateAudParams): Either<string, string> => {
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
