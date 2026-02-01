import "server-only";

import { EitherAsync } from "purify-ts";
import { secureHashWithSalt } from "./secure-hash-with-salt";
import { createItem } from "../db/create-item";
import { expire } from "../db/expire";
import { User } from "../types";
import {
  REFRESH_TOKEN_COOKIE_NAME,
  THIRTY_DAYS_IN_MILLISECONDS,
  THIRTY_DAYS_IN_SECONDS,
} from "./auth.constants";
import { logger } from "../logger";
import { randomChars } from "./random-chars";
import { getRefreshTokenKey } from "./get-refresh-token-key";
import { RefreshToken } from "./auth.types";
import { metadata } from "../db/metadata.factory";
import { setCookie } from "./set-cookie";

interface SetRefreshTokenParams {
  user: User;
  generateRefreshTokenFn?: typeof randomChars;
  secureHashWithSaltFn?: typeof secureHashWithSalt;
  createItemFn?: typeof createItem;
  expireFn?: typeof expire;
  setCookieFn?: typeof setCookie;
}

export const setRefreshToken = ({
  generateRefreshTokenFn = randomChars,
  createItemFn = createItem,
  secureHashWithSaltFn = secureHashWithSalt,
  expireFn = expire,
  setCookieFn = setCookie,
  user,
}: SetRefreshTokenParams): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ liftEither, fromPromise }) => {
    const token = await liftEither(generateRefreshTokenFn({}));

    const { hash, salt } = await fromPromise(
      secureHashWithSaltFn({ value: token }),
    );

    const refreshTokenKey = getRefreshTokenKey({ token });

    logger.debug("Generated token, creating refresh token item in database");

    const refreshToken = await liftEither(
      RefreshToken.decode({
        ...metadata(user),
        hash,
        salt,
        user,
      }),
    );

    await fromPromise(
      createItemFn({
        item: refreshToken,
        getKeyFn: () => refreshTokenKey,
      }),
    );

    logger.debug("Created refresh token item, expiring in 30 days");

    await fromPromise(
      expireFn({
        key: refreshTokenKey,
        numSecondsToExpire: THIRTY_DAYS_IN_SECONDS,
      }),
    );

    logger.debug("Expiration set, setting refresh cookie");

    logger.debug("Setting refresh token cookie");

    await setCookieFn({
      cookieName: REFRESH_TOKEN_COOKIE_NAME,
      value: token,
      expires: new Date(Date.now() + THIRTY_DAYS_IN_MILLISECONDS),
    });
  });
};
