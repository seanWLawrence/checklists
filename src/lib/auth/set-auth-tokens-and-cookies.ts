import "server-only";

import { EitherAsync } from "purify-ts";
import { setAccessJwtCookie } from "./set-access-jwt-cookie";
import { generateAccessJwt } from "./generate-access-jwt";
import { User } from "../types";
import { logger } from "../logger";
import { setRefreshToken } from "./set-refresh-token";
import { AUTH_SECRET } from "@/lib/env.server";

interface SetAuthTokensAndCookiesParams {
  authSecret?: string;
  user: User;
  generateAccessJwtFn?: typeof generateAccessJwt;
  setAccessJwtCookieFn?: typeof setAccessJwtCookie;
  setRefreshTokenFn?: typeof setRefreshToken;
}

export const setAuthTokensAndCookies = ({
  authSecret = AUTH_SECRET,
  user,
  generateAccessJwtFn = generateAccessJwt,
  setAccessJwtCookieFn = setAccessJwtCookie,
  setRefreshTokenFn = setRefreshToken,
}: SetAuthTokensAndCookiesParams): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise }) => {
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
