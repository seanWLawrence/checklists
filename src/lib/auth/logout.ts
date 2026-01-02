import "server-only";
import { redirect } from "next/navigation";
import { EitherAsync } from "purify-ts/EitherAsync";

import { revokeRefreshToken } from "./revoke-refresh-token";
import { revokeAccessToken } from "./revoke-access-token";
import { getRefreshCookie } from "./get-refresh-cookie";
import { logger } from "../logger";
import { revalidatePath } from "next/cache";
import { validateUserLoggedIn } from "./validate-user-logged-in";

export const logout = async ({
  validateUserLoggedInFn = validateUserLoggedIn,
  getRefreshCookieFn = getRefreshCookie,
  revokeRefreshTokenFn = revokeRefreshToken,
  revokeAccessTokenFn = revokeAccessToken,
  redirectFn = redirect,
  revalidatePathFn = revalidatePath,
}: {
  validateUserLoggedInFn?: typeof validateUserLoggedIn;
  getRefreshCookieFn?: typeof getRefreshCookie;
  revokeRefreshTokenFn?: typeof revokeRefreshToken;
  revokeAccessTokenFn?: typeof revokeAccessToken;
  redirectFn?: (path: string) => never;
  revalidatePathFn?: typeof revalidatePath;
}): Promise<void> => {
  await EitherAsync(async ({ fromPromise }) => {
    logger.debug("Logging out");

    await fromPromise(validateUserLoggedInFn({ variant: "server-action" }));

    const refreshCookie = await fromPromise(
      getRefreshCookieFn({}).toEitherAsync(
        "Couldn't find refresh token cookie",
      ),
    );

    await fromPromise(revokeRefreshTokenFn({ token: refreshCookie.value }));

    revokeAccessTokenFn({});
  }).run();

  revalidatePathFn("/", "layout");
  redirectFn("/login");
};
