import { EitherAsync } from "purify-ts/EitherAsync";
import { Key } from "@/lib/types";
import { getClient } from "./get-client";

export const deleteAllItems = ({
  keys,
  getClientFn = getClient,
}: {
  keys: Key[];
  getClientFn?: typeof getClient;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ liftEither, throwE }): Promise<void> => {
    if (keys.length === 0) {
      return;
    }

    const client = await liftEither(getClientFn({}));

    const response = await client.del(...keys);

    if (response === 0) {
      throwE(`Failed to delete one or more ${keys.join(", ")}`);
      return;
    }
  });
};
