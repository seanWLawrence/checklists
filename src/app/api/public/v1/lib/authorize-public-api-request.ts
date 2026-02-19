import { NextRequest, NextResponse } from "next/server";

import { ApiTokenScope } from "@/lib/auth/api-token/api-token.types";
import { validateApiToken } from "@/lib/auth/api-token/validate-api-token";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";
import { User } from "@/lib/types";

const RATE_LIMIT_PER_MINUTE = 120;
const RATE_LIMIT_WINDOW_SECONDS = 60;

export const authorizePublicApiRequest = async ({
  request,
  requiredScope,
  validateApiTokenFn = validateApiToken,
  enforceRateLimitFn = enforceRateLimit,
}: {
  request: NextRequest;
  requiredScope: ApiTokenScope;
  validateApiTokenFn?: typeof validateApiToken;
  enforceRateLimitFn?: typeof enforceRateLimit;
}): Promise<
  | { ok: true; user: User; tokenId: string }
  | { ok: false; response: NextResponse }
> => {
  const authResultEither = await validateApiTokenFn({
    request,
    requiredScope,
  }).run();

  const authResult = authResultEither
    .mapLeft((error) => {
      return {
        ok: false as const,
        response: NextResponse.json(
          {
            error: error.status === 403 ? "Forbidden" : "Unauthorized",
          },
          { status: error.status },
        ),
      };
    })
    .map((result) => {
      return {
        ok: true as const,
        user: result.user,
        tokenId: result.tokenId,
      };
    })
    .extract();

  if (authResult.ok) {
    const rateLimitKey = `rateLimit#publicApi#token#${authResult.tokenId}`;
    const rateLimitResult = await enforceRateLimitFn({
      key: rateLimitKey,
      limit: RATE_LIMIT_PER_MINUTE,
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    }).run();

    if (rateLimitResult.isRight() && !rateLimitResult.extract().allowed) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Too Many Requests" },
          {
            status: 429,
            headers: {
              "Retry-After": String(
                rateLimitResult.extract().retryAfterSeconds,
              ),
            },
          },
        ),
      };
    }

    if (rateLimitResult.isLeft()) {
      logger.warn(
        "Public API rate limit check failed",
        rateLimitResult.extract(),
      );
    }

    logger.info("Public API request authorized", {
      tokenId: authResult.tokenId,
      scope: requiredScope,
      method: request.method,
      path: request.nextUrl.pathname,
    });
  }

  return authResult;
};
