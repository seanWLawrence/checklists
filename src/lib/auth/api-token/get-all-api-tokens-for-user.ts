import { EitherAsync } from "purify-ts";

import { ApiToken } from "./api-token.types";
import { scan } from "@/lib/redis/scan";
import { getAllItems } from "@/lib/redis/get-all-items";
import { Key, User } from "@/lib/types";

export const getAllApiTokensForUser = ({
  user,
}: {
  user: User;
}): EitherAsync<unknown, ApiToken[]> => {
  return EitherAsync(async ({ fromPromise }) => {
    const scanKey: Key = `user#${user.username}#apiToken#*`;
    const keys = await fromPromise(scan({ key: scanKey }));
    const apiTokens = await fromPromise(
      getAllItems({ keys, decoder: ApiToken }),
    );

    return apiTokens.sort(
      (a, b) => b.createdAtIso.getTime() - a.createdAtIso.getTime(),
    );
  });
};
