import {
  ACCESS_JWT_COOKIE_NAME,
  FIFTEEN_MINUTES_IN_MILLISECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
  THIRTY_DAYS_IN_MILLISECONDS,
} from "@/lib/auth/auth.constants";
import { getRefreshCookie } from "@/lib/auth/get-refresh-cookie";
import { getSecureCookieParams } from "@/lib/auth/get-secure-cookie-params";
import { revokeRefreshToken } from "@/lib/auth/revoke-refresh-token";
import { setAuthTokensAndCookies } from "@/lib/auth/set-tokens-and-cookies";
import { validateRefreshToken } from "@/lib/auth/validate-refresh-token";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { logger } from "@/lib/logger";
import { NextResponse, NextRequest } from "next/server";
import { Either, EitherAsync } from "purify-ts";

export const handleAuth = async ({
  authSecret,
  request,
  redirectFn = NextResponse.redirect,
  validateUserLoggedInFn = validateUserLoggedIn,
  getRefreshCookieFn = getRefreshCookie,
  validateRefreshTokenFn = validateRefreshToken,
  revokeRefreshTokenFn = revokeRefreshToken,
  setAuthTokensAndCookiesFn = setAuthTokensAndCookies,
}: {
  authSecret: Either<unknown, string>;
  request: Pick<NextRequest, "url"> & { cookies: NextRequest["cookies"] };
  redirectFn?: typeof NextResponse.redirect;
  validateUserLoggedInFn?: typeof validateUserLoggedIn;
  getRefreshCookieFn?: typeof getRefreshCookie;
  validateRefreshTokenFn?: typeof validateRefreshToken;
  revokeRefreshTokenFn?: typeof revokeRefreshToken;
  setAuthTokensAndCookiesFn?: typeof setAuthTokensAndCookies;
}): Promise<NextResponse> => {
  const result = await EitherAsync<unknown, NextResponse>(
    async ({ fromPromise }) => {
      logger.debug("Handle auth middleware");

      const isLoginPage = request.url.includes("/login");

      if (isLoginPage) {
        return NextResponse.next();
      }

      logger.debug("Not login page, validating user logged in");

      const loggedInUser = await validateUserLoggedInFn({}).toMaybeAsync();

      if (loggedInUser.isJust()) {
        logger.debug("User logged in", loggedInUser.extract());

        return NextResponse.next();
      }

      logger.debug("User not logged in, checking for refresh token cookie");

      const refreshTokenCookie = await fromPromise(
        getRefreshCookieFn({ request }).toEitherAsync(
          "No access cookie or refresh cookie",
        ),
      );

      logger.debug("Refresh cookie found, validating");

      const user = await fromPromise(
        validateRefreshTokenFn({ token: refreshTokenCookie.value }),
      );

      logger.debug("Refresh cookie is valid, revoking");

      await fromPromise(
        revokeRefreshTokenFn({ token: refreshTokenCookie.value }),
      );

      logger.debug(
        "Refresh token revoked, generating and setting new auth cookies",
      );

      const response = NextResponse.next();

      await fromPromise(
        setAuthTokensAndCookiesFn({
          authSecret,
          user,
          setAccessJwtCookieFn: ({ jwt }) => {
            response.cookies.set(
              ACCESS_JWT_COOKIE_NAME,
              jwt,
              getSecureCookieParams({
                expires: new Date(Date.now() + FIFTEEN_MINUTES_IN_MILLISECONDS),
              }),
            );
          },
          setRefreshTokenCookieFn: ({ token }) => {
            response.cookies.set(
              REFRESH_TOKEN_COOKIE_NAME,
              token,
              getSecureCookieParams({
                expires: new Date(Date.now() + THIRTY_DAYS_IN_MILLISECONDS),
              }),
            );
          },
        }),
      );

      logger.debug("New access and refresh tokens and cookies set");

      return response;
    },
  );

  if (result.isRight()) {
    return result.extract();
  } else {
    logger.debug("User not logged in, trying to get new access token");

    return redirectFn(new URL("/login", request.url));
  }
};
