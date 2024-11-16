import { EitherAsync } from "purify-ts/EitherAsync";
import { getRefreshTokenKey } from "./get-refresh-token-key";
import { deleteCookie } from "./delete-cookie";
import { REFRESH_TOKEN_COOKIE_NAME } from "./auth.constants";
import { deleteAllItems } from "../db/delete-all-items";

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

    await fromPromise(deleteAllItemsFn({ keys: [refreshTokenKey] }));

    deleteCookieFn({ name: REFRESH_TOKEN_COOKIE_NAME });
  });
};
