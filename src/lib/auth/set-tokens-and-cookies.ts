import { Either, EitherAsync } from "purify-ts";
import { setAccessJwtCookie } from "./set-access-jwt-cookie";
import { secureHash } from "./secure-hash";
import { generateAccessJwt } from "./generate-access-jwt";
import { createItem } from "../db/create-item";
import { expire } from "../db/expire";
import { User } from "../types";
import { AUTH_SECRET, THIRTY_DAYS_IN_SECONDS } from "./auth.constants";
import { logger } from "../logger";
import { randomChars } from "./random-chars";
import { getRefreshTokenKey } from "./get-refresh-token-key";
import { RefreshToken } from "./auth.types";
import { setRefreshTokenCookie } from "./set-refresh-token-cookie";
import { metadata } from "../db/metadata.factory";

export interface SetAuthTokensAndCookiesParams {
  authSecret: Either<unknown, string>;
  user: User;
  generateAccessJwtFn?: typeof generateAccessJwt;
  generateRefreshTokenFn?: typeof randomChars;
  setAccessJwtCookieFn?: typeof setAccessJwtCookie;
  setRefreshTokenCookieFn?: typeof setRefreshTokenCookie;
  secureHashFn?: typeof secureHash;
  createItemFn?: typeof createItem;
  expireFn?: typeof expire;
}

export const setAuthTokensAndCookies = ({
  authSecret: authSecretEither = AUTH_SECRET,
  user,
  generateAccessJwtFn = generateAccessJwt,
  generateRefreshTokenFn = randomChars,
  setAccessJwtCookieFn = setAccessJwtCookie,
  setRefreshTokenCookieFn = setRefreshTokenCookie,
  secureHashFn = secureHash,
  createItemFn = createItem,
  expireFn = expire,
}: SetAuthTokensAndCookiesParams): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ liftEither, fromPromise }) => {
    const authSecret = await liftEither(authSecretEither);

    const accessJwt = await generateAccessJwtFn({
      authSecret,
      user,
    });

    logger.debug("Generating refresh token");

    const token = await liftEither(generateRefreshTokenFn({}));

    const { hash, salt } = await fromPromise(secureHashFn({ value: token }));

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

    logger.debug("Exiration set, setting auth cookies");

    setAccessJwtCookieFn({ jwt: accessJwt });

    setRefreshTokenCookieFn({ token });
  });
};
