import { redirect } from "next/navigation";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getUser } from "./get-user";
import { revokeRefreshToken } from "./revoke-refresh-token";
import { revokeAccessToken } from "./revoke-access-token";
import { getRefreshCookie } from "./get-refresh-cookie";
import { logger } from "../logger";

export const logout = async ({
  getUserFn = getUser,
  getRefreshCookieFn = getRefreshCookie,
  revokeRefreshTokenFn = revokeRefreshToken,
  revokeAccessTokenFn = revokeAccessToken,
  redirectFn = redirect,
}: {
  getUserFn?: typeof getUser;
  getRefreshCookieFn?: typeof getRefreshCookie;
  revokeRefreshTokenFn?: typeof revokeRefreshToken;
  revokeAccessTokenFn?: typeof revokeAccessToken;
  redirectFn?: (path: string) => never;
}): Promise<void> => {
  await EitherAsync(async ({ fromPromise }) => {
    logger.debug("Logging out");

    const user = await fromPromise(getUserFn({}));

    if (user) {
      const refreshCookie = await fromPromise(
        getRefreshCookieFn({}).toEitherAsync(
          "Couldn't find refresh token cookie",
        ),
      );

      await fromPromise(revokeRefreshTokenFn({ token: refreshCookie.value }));

      revokeAccessTokenFn({});
    }
  });

  redirectFn("/login");
};
