import { EitherAsync } from "purify-ts";
import { NextRequest } from "next/server";

import { getSingleItem } from "@/lib/db/get-single-item";
import { ApiToken, ApiTokenScope } from "./api-token.types";
import {
  parseApiToken,
  parseBearerTokenFromAuthorizationHeader,
} from "./parse-api-token";
import { getApiTokenKey } from "./get-api-token-key";
import { secureHashSha256 } from "../secure-hash-sha256";
import { constantTimeStringComparison } from "../constant-time-string-comparison";
import { User } from "@/lib/types";

interface ApiTokenAuthError {
  status: 401 | 403;
  message: string;
}

export const validateApiToken = ({
  request,
  requiredScope,
  now = () => new Date(),
  getSingleItemFn = getSingleItem,
  hashFn = secureHashSha256,
}: {
  request: Pick<NextRequest, "headers">;
  requiredScope?: ApiTokenScope;
  now?: () => Date;
  getSingleItemFn?: typeof getSingleItem;
  hashFn?: typeof secureHashSha256;
}): EitherAsync<ApiTokenAuthError, { user: User; tokenId: string }> => {
  return EitherAsync(async ({ liftEither, fromPromise, throwE }) => {
    const bearerToken = await liftEither(
      parseBearerTokenFromAuthorizationHeader(
        request.headers.get("authorization"),
      ),
    );
    const parsedApiToken = await liftEither(parseApiToken(bearerToken));
    const storedToken = await fromPromise(
      getSingleItemFn({
        key: getApiTokenKey({
          username: parsedApiToken.username,
          id: parsedApiToken.id,
        }),
        decoder: ApiToken,
      }),
    );

    const hashedInputSecret = await liftEither(hashFn(parsedApiToken.secret));

    if (!constantTimeStringComparison(hashedInputSecret, storedToken.hash)) {
      return throwE({
        status: 401,
        message: "Invalid API token",
      });
    }

    if (storedToken.revokedAtIso) {
      return throwE({
        status: 401,
        message: "API token was revoked",
      });
    }

    if (storedToken.expiresAtIso.getTime() <= now().getTime()) {
      return throwE({
        status: 401,
        message: "API token has expired",
      });
    }

    if (requiredScope && !storedToken.scopes.includes(requiredScope)) {
      return throwE({
        status: 403,
        message: `Missing required scope '${requiredScope}'`,
      });
    }

    return { user: storedToken.user, tokenId: storedToken.id };
  }).mapLeft((error) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      "message" in error
    ) {
      return error as ApiTokenAuthError;
    }

    return {
      status: 401 as const,
      message: String(error),
    };
  });
};
