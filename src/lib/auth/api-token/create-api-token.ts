import { EitherAsync } from "purify-ts";

import { User } from "@/lib/types";
import { randomChars } from "../random-chars";
import { secureHashSha256 } from "../secure-hash-sha256";
import { createItem } from "@/lib/db/create-item";
import {
  ApiToken,
  ApiTokenScope,
  API_TOKEN_PREFIX,
  ApiTokenId,
} from "./api-token.types";
import { getApiTokenKey } from "./get-api-token-key";
import { metadata } from "@/lib/db/metadata.factory";
import { expire } from "@/lib/db/expire";

const ONE_YEAR_IN_MILLISECONDS = 365 * 24 * 60 * 60 * 1000;

const getNumSecondsUntil = ({ date }: { date: Date }): number =>
  Math.max(1, Math.floor((date.getTime() - Date.now()) / 1000));

export const createApiToken = ({
  user,
  name,
  scopes,
  expiresAtIso,
}: {
  user: User;
  name: string;
  scopes: ApiTokenScope[];
  expiresAtIso?: string;
}): EitherAsync<
  unknown,
  { token: string; id: ApiTokenId; createdAtIso: string; expiresAtIso: string }
> => {
  return EitherAsync(async ({ liftEither, fromPromise }) => {
    const tokenMetadata = metadata(user);
    const secret = await liftEither(randomChars({}));
    const hash = await liftEither(secureHashSha256(secret));
    const defaultExpiresAt = new Date(Date.now() + ONE_YEAR_IN_MILLISECONDS);
    const resolvedExpiresAt = expiresAtIso ? new Date(expiresAtIso) : defaultExpiresAt;

    const apiToken = await liftEither(
      ApiToken.decode({
        ...tokenMetadata,
        name,
        hash,
        scopes,
        expiresAtIso: resolvedExpiresAt.toISOString(),
      }),
    );

    await fromPromise(
      createItem({
        item: apiToken,
        getKeyFn: ({ id, user }) =>
          getApiTokenKey({ username: user.username, id }),
      }),
    );

    await fromPromise(
      expire({
        key: getApiTokenKey({
          username: apiToken.user.username,
          id: apiToken.id,
        }),
        numSecondsToExpire: getNumSecondsUntil({ date: apiToken.expiresAtIso }),
      }),
    );

    return {
      token: `${API_TOKEN_PREFIX}${apiToken.user.username}.${apiToken.id}.${secret}`,
      id: apiToken.id,
      createdAtIso: apiToken.createdAtIso.toISOString(),
      expiresAtIso: apiToken.expiresAtIso.toISOString(),
    };
  });
};
