import { test, vi } from "vitest";
import { EitherAsync } from "purify-ts";
import { Left, Right } from "purify-ts/Either";
import { NextRequest } from "next/server";

import { authorizePublicApiRequest } from "./authorize-public-api-request";

const makeRequest = (url = "http://localhost:3000/api/public/notes") =>
  new NextRequest(url, { method: "GET" });

test("returns generic unauthorized response", async ({ expect }) => {
  const validateApiTokenFn = vi.fn().mockReturnValue(
    EitherAsync(async ({ liftEither }) =>
      liftEither(Left({ status: 401, message: "very secret failure" })),
    ),
  );
  const enforceRateLimitFn = vi.fn();

  const result = await authorizePublicApiRequest({
    request: makeRequest(),
    requiredScope: "notes:list",
    validateApiTokenFn,
    enforceRateLimitFn,
  });

  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({ error: "Unauthorized" });
  }
});

test("returns 429 when token exceeds rate limit", async ({ expect }) => {
  const validateApiTokenFn = vi.fn().mockReturnValue(
    EitherAsync(async ({ liftEither }) =>
      liftEither(
        Right({
          user: { username: "sean" },
          tokenId: "token-id",
        }),
      ),
    ),
  );
  const enforceRateLimitFn = vi.fn().mockReturnValue(
    EitherAsync(async ({ liftEither }) =>
      liftEither(
        Right({
          allowed: false,
          retryAfterSeconds: 60,
          remaining: 0,
        }),
      ),
    ),
  );

  const result = await authorizePublicApiRequest({
    request: makeRequest(),
    requiredScope: "notes:list",
    validateApiTokenFn,
    enforceRateLimitFn,
  });

  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.response.status).toBe(429);
    expect(result.response.headers.get("Retry-After")).toBe("60");
    expect(await result.response.json()).toEqual({
      error: "Too Many Requests",
    });
  }
});
