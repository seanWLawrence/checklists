import { Codec, EitherAsync } from "purify-ts";
import { Key } from "../types";
import { getSingleItem } from "./get-single-item";
import { logger } from "../logger";

export const getAllItems = <T extends object>({
  keys,
  decoder,
  getSingleItemFn = getSingleItem,
}: {
  keys: Key[];
  decoder: Codec<T>;
  getSingleItemFn?: typeof getSingleItem;
}): EitherAsync<unknown, T[]> => {
  return EitherAsync(async ({ fromPromise }) => {
    logger.debug(`Getting all items with keys: ${keys.join(", ")}`);

    const promises = keys.map((key) => {
      return getSingleItemFn({
        decoder,
        key,
      });
    });

    const result = await fromPromise(
      EitherAsync.all(promises).map((values) => {
        return values.filter(Boolean) as T[];
      }),
    );

    return result;
  });
};
