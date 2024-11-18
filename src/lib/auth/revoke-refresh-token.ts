import { EitherAsync } from "purify-ts/EitherAsync";
import { getRefreshTokenKey } from "./get-refresh-token-key";
import { deleteCookie } from "./delete-cookie";
import { REFRESH_TOKEN_COOKIE_NAME } from "./auth.constants";
import { deleteAllItems } from "../db/delete-all-items";
import { logger } from "../logger";

export const revokeRefreshToken = async ({
  token,
  deleteCookieFn = deleteCookie,
  deleteAllItemsFn = deleteAllItems,
}: {
  token: string;
  deleteCookieFn?: typeof deleteCookie;
  deleteAllItemsFn?: typeof deleteAllItems;
}) => {
  return EitherAsync(async ({ fromPromise }) => {
    const refreshTokenKey = getRefreshTokenKey({ token });

    logger.debug("Deleting refresh token from db");

    await fromPromise(deleteAllItemsFn({ keys: [refreshTokenKey] }));

    logger.debug("Deleting refresh cookie");

    deleteCookieFn({ name: REFRESH_TOKEN_COOKIE_NAME });
  });
};
