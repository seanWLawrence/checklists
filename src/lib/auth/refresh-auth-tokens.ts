import { EitherAsync } from "purify-ts/EitherAsync";
import { getRefreshCookie } from "./get-refresh-cookie";
import { logger } from "../logger";
import { validateRefreshToken } from "./validate-refresh-token";
import { revokeRefreshToken } from "./revoke-refresh-token";
import { setAuthTokensAndCookies } from "./set-auth-tokens-and-cookies";
import { AUTH_SECRET } from "./auth.constants";
import { cookies } from "next/headers";
import { User } from "../types";
import { NextRequest } from "next/server";
import { getUser } from "./get-user";

const ONE_MINUTE_IN_MILLI = 1000 * 60;

type RefreshAuthTokensStatus = "tokensUnchanged" | "tokensRefreshed";

export const refreshAuthTokens = ({
  request,
}: {
  request?: { cookies: NextRequest["cookies"] };
}): EitherAsync<unknown, { status: RefreshAuthTokensStatus; user: User }> => {
  return EitherAsync(async ({ fromPromise }) => {
    const userMaybe = await getUser({});

    if (userMaybe.isJust()) {
      return { user: userMaybe.extract(), status: "tokensUnchanged" as const };
    }

    const cookieStore = request?.cookies ?? (await cookies());

    const refreshTokenCookie = await fromPromise(
      getRefreshCookie({
        request: { cookies: cookieStore },
      }).toEitherAsync("No refresh cookie found"),
    );

    logger.debug("Refresh cookie found, validating");

    const refreshToken = await fromPromise(
      validateRefreshToken({ token: refreshTokenCookie.value }),
    );

    const willExpireSoon =
      new Date().getTime() - refreshToken.createdAtIso.getTime() <=
      ONE_MINUTE_IN_MILLI;

    if (willExpireSoon) {
      logger.debug("Refresh cookie is valid, revoking");

      await fromPromise(
        revokeRefreshToken({
          token: refreshTokenCookie.value,
        }),
      );

      logger.debug(
        "Refresh token revoked, generating and setting new auth cookies",
      );

      await fromPromise(
        setAuthTokensAndCookies({
          authSecret: AUTH_SECRET,
          user: refreshToken.user,
        }),
      );

      logger.debug("New access and refresh tokens and cookies set");

      return { status: "tokensRefreshed" as const, user: refreshToken.user };
    }

    logger.debug(
      "Refresh token is valid and not expiring soon, genearting new access tokken only",
    );

    await fromPromise(
      setAuthTokensAndCookies({
        authSecret: AUTH_SECRET,
        user: refreshToken.user,
        // Skipping refresh token creation since it's not expiring soon
        setRefreshTokenCookieFn: async () => void 0,
      }),
    );

    return { status: "tokensRefreshed" as const, user: refreshToken.user };
  }).ifLeft((error) => {
    logger.error("Failed to refresh auth tokens", error);
  });
};
