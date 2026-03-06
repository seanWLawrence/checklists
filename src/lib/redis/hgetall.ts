import { Codec, EitherAsync } from "purify-ts";

import { getClient } from "./get-client";
import { Key } from "../types";

export const hgetall = <T extends object>({
  key,
  decoder,
  getClientFn = getClient,
}: {
  key: Key;
  decoder: Codec<T>;
  getClientFn?: typeof getClient;
}): EitherAsync<unknown, T> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const client = await liftEither(getClientFn({}));

    try {
      const response = await client.hgetall(key);

      if (response === null) {
        return throwE(`Object not found for key: '${key}'`);
      }

      const result = await liftEither(decoder.decode(response));

      return result;
    } catch (e) {
      return throwE(e);
    }
  });
};
