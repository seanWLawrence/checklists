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
    logger.debug("Creating item");

    const key = getKeyFn(item);

    logger.debug(`Key to create: ${key}`);

    logger.debug(`Creating item: ${JSON.stringify(item, null, 2)}`);

    await fromPromise(hmsetFn({ key, item }));

    return item;
  });
};
