import "server-only";

import { EitherAsync } from "purify-ts";

import { getClient } from "@/lib/db/get-client";

export const enforceRateLimit = ({
  key,
  limit,
  windowSeconds,
  getClientFn = getClient,
}: {
  key: string;
  limit: number;
  windowSeconds: number;
  getClientFn?: typeof getClient;
}): EitherAsync<
  unknown,
  {
    allowed: boolean;
    retryAfterSeconds: number;
    remaining: number;
  }
> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const client = await liftEither(getClientFn({}));

    try {
      const currentCount = await client.incr(key);

      if (currentCount === 1) {
        await client.expire(key, windowSeconds);
      }

      const remaining = Math.max(0, limit - currentCount);
      const allowed = currentCount <= limit;

      return {
        allowed,
        retryAfterSeconds: windowSeconds,
        remaining,
      };
    } catch (error) {
      return throwE(error);
    }
  });
};
