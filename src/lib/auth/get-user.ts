import { NextRequest } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Either } from "purify-ts/Either";
import invariant from "tiny-invariant";

import { AUTH_SECRET } from "./auth.constants";
import { getAccessCookie } from "./get-access-cookie";
import { validateAccessJwt } from "./validate-access-jwt";
import { User } from "../types";
import { logger } from "../logger";

export const getUser = ({
  request,
  authSecret: authSecretEither = AUTH_SECRET,
  getAccessCookieFn = getAccessCookie,
  validateAccessJwtFn = validateAccessJwt,
}: {
  request?: NextRequest;
  authSecret?: Either<unknown, string>;
  getAccessCookieFn?: typeof getAccessCookie;
  validateAccessJwtFn?: typeof validateAccessJwt;
}): EitherAsync<unknown, User | null> => {
  return EitherAsync(async ({ liftEither, fromPromise }) => {
    logger.getLogger("getUser").debug("Getting auth secret");

    const authSecret = await liftEither(authSecretEither);

    logger.debug("Auth secret found, getting accessJwt cookie");

    const accessJwtCookie = await getAccessCookieFn({ request });

    const accessJwt = await liftEither(
      accessJwtCookie
        .map((cookie) => cookie.value)
        .toEither("No access cookie"),
    );

    logger.debug("Access cookie found, validating");

    const accessJwtPayload = await fromPromise(
      validateAccessJwtFn({
        jwt: accessJwt,
        authSecret,
      }),
    );

    const username = await liftEither(
      Either.encase(() => {
        invariant(accessJwtPayload.sub, "No sub");

        return accessJwtPayload.sub;
      }),
    );

    return { username };
  })
    .ifLeft((e) => logger.debug(e))
    .mapLeft(() => null);
};
