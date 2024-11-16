import { EitherAsync } from "purify-ts";

import { getClient } from "./get-client";
import { isOk } from "./is-ok";
import { Key } from "../types";

export const hmset = <T extends object>({
  key,
  item,
  getClientFn = getClient,
}: {
  key: Key;
  item: T;
  getClientFn?: typeof getClient;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const client = await liftEither(getClientFn({}));

    try {
      const result = await client.hmset(
        key,
        item as { [field: string]: unknown },
      );

      if (!isOk(result)) {
        return throwE(`Failed to create ${key}`);
      }

      return;
    } catch (e) {
      return throwE(e);
    }
  });
};
