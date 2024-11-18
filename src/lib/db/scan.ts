import { Either, EitherAsync } from "purify-ts";

import { getClient } from "./get-client";
import { Key } from "../types";
import { logger } from "../logger";

export const scan = ({
  key,
  cursor = "0",
  previousKeys = [],
  getClientFn = getClient,
}: {
  key: Key;
  cursor?: string;
  previousKeys?: Key[];
  getClientFn?: typeof getClient;
}): EitherAsync<unknown, Key[]> => {
  return EitherAsync(async ({ fromPromise, liftEither, throwE }) => {
    logger.debug(`Scanning with key: ${key}`);

    const client = await liftEither(getClientFn({}));

    try {
      const [newCursor, ...keysRaw] = await client.scan(cursor, {
        type: "hash",
        match: key,
      });

      const validKeys = await liftEither(
        Either.sequence(
          keysRaw.flat().map((key) => {
            return Key.decode(key);
          }),
        ),
      );

      const allKeysSoFar = [...previousKeys, ...validKeys];

      const done = newCursor === "0";

      if (done) {
        logger.debug("All keys found");

        return allKeysSoFar;
      }

      logger.debug("Fetching more keys");

      return fromPromise(
        scan({
          key,
          cursor: newCursor,
          previousKeys: allKeysSoFar,
          // Since we've already called this, just pass the value
          getClientFn: () => Either.of(client),
        }),
      );
    } catch (e) {
      return throwE(e);
    }
  });
};
