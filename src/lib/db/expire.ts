import { EitherAsync } from "purify-ts";

import { getClient } from "./get-client";
import { Key } from "../types";
import { logger } from "../logger";

export const expire = ({
  key,
  numSecondsToExpire,
  getClientFn = getClient,
}: {
  key: Key;
  getClientFn?: typeof getClient;
  numSecondsToExpire: number;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const client = await liftEither(getClientFn({}));

    logger.debug(
      `Expiring key: ${key}, numSecondsToExpire: ${numSecondsToExpire}`,
    );

    try {
      const result = await client.expire(key, numSecondsToExpire);

      if (result === 0) {
        return throwE(`Failed to expire '${key}'`);
      }

      return;
    } catch (e) {
      logger.debug("Failed to expire", e);

      return throwE(e);
    }
  });
};
