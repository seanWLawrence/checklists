import "server-only";
import { NextRequest } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Either } from "purify-ts/Either";
import invariant from "@/lib/invariant";
import { MaybeAsync } from "purify-ts/MaybeAsync";

import { getAccessCookie } from "./get-access-cookie";
import { validateAccessJwt } from "./validate-access-jwt";
import { User } from "../types";
import { logger } from "../logger";
import { AUTH_SECRET } from "@/lib/env.server";

export const getUser = ({
  request,
  authSecret = AUTH_SECRET,
  getAccessCookieFn = getAccessCookie,
  validateAccessJwtFn = validateAccessJwt,
}: {
  request?: Pick<NextRequest, "url"> & { cookies: NextRequest["cookies"] };
  authSecret?: string;
  getAccessCookieFn?: typeof getAccessCookie;
  validateAccessJwtFn?: typeof validateAccessJwt;
}): MaybeAsync<User> => {
  return EitherAsync<unknown, User>(async ({ liftEither, fromPromise }) => {
    logger.debug("Getting user");

    const accessJwtCookie = await getAccessCookieFn({ request });

    const accessJwt = await liftEither(
      accessJwtCookie
        .map((cookie) => cookie.value)
        .toEither("No access cookie"),
    );

    const accessJwtPayload = await fromPromise(
      validateAccessJwtFn({
        jwt: accessJwt,
        authSecret,
      }),
    );

    const username = await liftEither(
      Either.encase(() => {
        logger.debug("Jwt validated, getting username");

        invariant(accessJwtPayload.sub, "No sub");

        return accessJwtPayload.sub;
      }),
    );

    return { username };
  })
    .ifLeft((e) => logger.debug(e))
    .toMaybeAsync();
};
