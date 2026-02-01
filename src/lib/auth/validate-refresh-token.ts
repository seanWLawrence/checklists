import "server-only";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getSingleItem } from "../db/get-single-item";
import { getRefreshTokenKey } from "./get-refresh-token-key";
import { RefreshToken } from "./auth.types";
import { THIRTY_DAYS_IN_MILLISECONDS } from "./auth.constants";
import { secureHashWithSalt } from "./secure-hash-with-salt";
import { Either } from "purify-ts/Either";
import { logger } from "../logger";
import { constantTimeStringComparison } from "./constant-time-string-comparison";

interface ValidateRefreshTokenParams {
  token: string;
  getSingleItemFn?: typeof getSingleItem;
  secureHashWithSaltFn?: typeof secureHashWithSalt;
}

export const validateRefreshToken = ({
  token,
  getSingleItemFn = getSingleItem,
  secureHashWithSaltFn = secureHashWithSalt,
}: ValidateRefreshTokenParams): EitherAsync<unknown, RefreshToken> => {
  return EitherAsync(async ({ fromPromise, throwE }) => {
    logger.debug("Validating refresh token");

    const refreshTokenFromDb = await fromPromise(
      getSingleItemFn({
        key: getRefreshTokenKey({ token }),
        decoder: RefreshToken,
      }),
    );

    const hashedToken = await fromPromise(
      secureHashWithSaltFn({
        value: token,
        saltFn: () => Either.of(refreshTokenFromDb.salt),
      }),
    );

    /**
     * Important to avoid matching timing attacks
     */
    const hashesMatch = constantTimeStringComparison(
      hashedToken.hash,
      refreshTokenFromDb.hash,
    );

    if (!hashesMatch) {
      return throwE("Refresh token hash doesn't match");
    }

    const numMillisecondsSinceIssued =
      new Date().getTime() - refreshTokenFromDb.createdAtIso.getTime();

    const wasIssuedMoreThan30DaysAgo =
      numMillisecondsSinceIssued > THIRTY_DAYS_IN_MILLISECONDS;

    if (wasIssuedMoreThan30DaysAgo) {
      return throwE("Refresh token expired");
    }

    return refreshTokenFromDb;
  });
};
