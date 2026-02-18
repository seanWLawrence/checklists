import { EitherAsync } from "purify-ts";

import { User } from "@/lib/types";
import { ApiToken, ApiTokenId } from "./api-token.types";
import { getSingleItem } from "@/lib/db/get-single-item";
import { getApiTokenKey } from "./get-api-token-key";
import { updateItem } from "@/lib/db/update-item";

export const revokeApiToken = ({
  user,
  id,
}: {
  user: User;
  id: ApiTokenId;
}): EitherAsync<unknown, ApiToken> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const existing = await fromPromise(
      getSingleItem({
        key: getApiTokenKey({ username: user.username, id }),
        decoder: ApiToken,
      }),
    );

    const revoked = await liftEither(
      ApiToken.decode({
        ...existing,
        createdAtIso: existing.createdAtIso.toISOString(),
        expiresAtIso: existing.expiresAtIso.toISOString(),
        lastUsedAtIso: existing.lastUsedAtIso?.toISOString(),
        revokedAtIso: new Date().toISOString(),
        updatedAtIso: new Date().toISOString(),
      }),
    );

    return fromPromise(
      updateItem({
        item: revoked,
        getKeyFn: ({ id: tokenId, user: tokenUser }) =>
          getApiTokenKey({ username: tokenUser.username, id: tokenId }),
      }),
    );
  });
};
