import { EitherAsync } from "purify-ts/EitherAsync";
import { Codec } from "purify-ts/Codec";
import { Key } from "../types";
import { hgetall } from "./hgetall";
import { logger } from "../logger";

export const getSingleItem = <T extends object>({
  key,
  decoder,
  hgetallFn = hgetall,
}: {
  key: Key;
  decoder: Codec<T>;
  hgetallFn?: typeof hgetall;
}): EitherAsync<unknown, T> => {
  return EitherAsync(async ({ fromPromise, throwE }) => {
    logger.debug(`Getting item for key: '${key}'`);

    const response = await fromPromise(hgetallFn({ key, decoder }));

    if (response === null) {
      return throwE(`Object not found for key: '${key}'`);
    }

    return response;
  });
};
