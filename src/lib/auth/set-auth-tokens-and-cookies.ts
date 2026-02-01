import "server-only";

import { Either, EitherAsync } from "purify-ts";
import { setAccessJwtCookie } from "./set-access-jwt-cookie";
import { generateAccessJwt } from "./generate-access-jwt";
import { User } from "../types";
import { AUTH_SECRET } from "@/lib/secrets";
import { logger } from "../logger";
import { setRefreshToken } from "./set-refresh-token";

interface SetAuthTokensAndCookiesParams {
  authSecret: Either<unknown, string>;
  user: User;
  generateAccessJwtFn?: typeof generateAccessJwt;
  setAccessJwtCookieFn?: typeof setAccessJwtCookie;
  setRefreshTokenFn?: typeof setRefreshToken;
}

export const setAuthTokensAndCookies = ({
  authSecret: authSecretEither = AUTH_SECRET,
  user,
  generateAccessJwtFn = generateAccessJwt,
  setAccessJwtCookieFn = setAccessJwtCookie,
  setRefreshTokenFn = setRefreshToken,
}: SetAuthTokensAndCookiesParams): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ liftEither, fromPromise }) => {
    const authSecret = await liftEither(authSecretEither);

    const accessJwt = await generateAccessJwtFn({
      authSecret,
      user,
    });

    logger.debug("Generating refresh token");

    await fromPromise(
      setRefreshTokenFn({
        user,
      }),
    );

    await setAccessJwtCookieFn({ jwt: accessJwt });
  });
};
