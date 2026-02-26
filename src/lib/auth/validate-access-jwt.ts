import "server-only";
import { EitherAsync } from "purify-ts/EitherAsync";
import { JWTPayload } from "jose";

import { AUD, FIFTEEN_MINUTES_IN_MILLISECONDS, ISS } from "@/lib/env.server";
import { validateAud } from "./validate-aud";
import { validateIss } from "./validate-iss";
import { ValidateJwtParams, validateJwt } from "./validate-jwt";
import { validateIssuedAt } from "./validate-iat";

export const validateAccessJwt = ({
  authSecret,
  jwt,
  validateJwtFn = validateJwt,
  validateIssFn = validateIss,
  validateAudFn = validateAud,
  validateIssuedAtFn = validateIssuedAt,
}: ValidateJwtParams & {
  validateJwtFn?: typeof validateJwt;
  validateIssFn?: typeof validateIss;
  validateAudFn?: typeof validateAud;
  validateIssuedAtFn?: typeof validateIssuedAt;
}): EitherAsync<unknown, JWTPayload> => {
  return EitherAsync(async ({ liftEither, fromPromise }) => {
    const payload = await fromPromise(validateJwtFn({ authSecret, jwt }));

    await liftEither(
      validateIssFn({ expectedIssMaybe: ISS, actualIss: payload.iss }),
    );

    await liftEither(
      validateAudFn({ expectedAudMaybe: AUD, actualAud: payload.aud }),
    );

    await liftEither(
      validateIssuedAtFn({
        iat: payload.iat,
        maxValidMilliIssuedFromNow: FIFTEEN_MINUTES_IN_MILLISECONDS,
      }),
    );

    return payload;
  });
};
