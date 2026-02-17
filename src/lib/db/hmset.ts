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
      const entries = Object.entries(item as Record<string, unknown>);
      const fieldsToDelete = entries
        .filter(([, value]) => value == null)
        .map(([field]) => field);

      const fieldsToSet = Object.fromEntries(
        entries.filter(([, value]) => value != null),
      );

      if (fieldsToDelete.length > 0) {
        await client.hdel(key, ...fieldsToDelete);
      }

      if (Object.keys(fieldsToSet).length === 0) {
        return;
      }

      const result = await client.hmset(
        key,
        fieldsToSet as { [field: string]: unknown },
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
