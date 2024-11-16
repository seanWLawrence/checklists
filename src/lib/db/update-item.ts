import { EitherAsync } from "purify-ts";

import { Key } from "../types";
import { hmset } from "./hmset";

export const updateItem = <T extends object>({
  item,
  getKeyFn,
  hmsetFn = hmset,
}: {
  item: T;
  getKeyFn: (item: T) => Key;
  hmsetFn?: typeof hmset;
}): EitherAsync<unknown, T> => {
  return EitherAsync(async ({ fromPromise }) => {
    const key = getKeyFn(item);

    await fromPromise(hmsetFn({ key, item }));

    return item;
  });
};
