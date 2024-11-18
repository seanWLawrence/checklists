import { EitherAsync } from "purify-ts";
import { Key } from "../types";
import { hmset } from "./hmset";
import { logger } from "../logger";

export const createItem = <T extends object>({
  item,
  getKeyFn,
  hmsetFn = hmset,
}: {
  item: T;
  getKeyFn: (itemToCreate: T) => Key;
  hmsetFn?: typeof hmset;
}): EitherAsync<unknown, T> => {
  return EitherAsync(async ({ fromPromise }) => {
    const key = getKeyFn(item);

    logger.debug(`Creating item with key: '${key}'`);

    await fromPromise(hmsetFn({ key, item }));

    return item;
  });
};
