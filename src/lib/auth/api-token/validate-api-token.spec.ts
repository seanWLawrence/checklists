import { test, vi } from "vitest";
import { EitherAsync } from "purify-ts";
import { Left, Right } from "purify-ts/Either";

import { validateApiToken } from "./validate-api-token";
import { ApiToken } from "./api-token.types";

const now = new Date("2026-02-20T00:00:00.000Z");

const makeStoredToken = () =>
  ApiToken.decode({
    id: "123e4567-e89b-12d3-a456-426614174000",
    user: { username: "sean" },
    name: "test token",
    hash: "hashed",
    scopes: ["notes:create"],
    createdAtIso: "2026-02-19T00:00:00.000Z",
    updatedAtIso: "2026-02-19T00:00:00.000Z",
    expiresAtIso: "2026-03-20T00:00:00.000Z",
  }).unsafeCoerce();

const makeRequest = (authorization: string | null) =>
  ({
    headers: new Headers(
      authorization ? { authorization } : undefined,
    ) as Headers,
  }) as { headers: Headers };

test("validateApiToken returns user and token id for a valid token", async ({
  expect,
}) => {
  const getSingleItemFn = vi.fn().mockReturnValue(
    EitherAsync(async ({ liftEither }) => {
      return liftEither(Right(makeStoredToken()));
    }),
  );
  const hashFn = vi.fn().mockReturnValue(Right("hashed"));
  const updateItemFn = vi.fn().mockReturnValue(
    EitherAsync(async ({ liftEither }) => {
      return liftEither(Right(makeStoredToken()));
    }),
  );

  const result = await validateApiToken({
    request: makeRequest(
      "Bearer pat_sean.123e4567-e89b-12d3-a456-426614174000.secret",
    ),
    requiredScope: "notes:create",
    now: () => now,
    getSingleItemFn,
    hashFn,
    updateItemFn,
  }).run();

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual({
    user: { username: "sean" },
    tokenId: "123e4567-e89b-12d3-a456-426614174000",
  });
  expect(updateItemFn).toHaveBeenCalledOnce();
});

test("validateApiToken fails with forbidden when scope is missing", async ({
  expect,
}) => {
  const token = makeStoredToken();
  const getSingleItemFn = vi.fn().mockReturnValue(
    EitherAsync(async ({ liftEither }) => liftEither(Right(token))),
  );
  const hashFn = vi.fn().mockReturnValue(Right("hashed"));
  const updateItemFn = vi.fn();

  const result = await validateApiToken({
    request: makeRequest(
      "Bearer pat_sean.123e4567-e89b-12d3-a456-426614174000.secret",
    ),
    requiredScope: "notes:update",
    now: () => now,
    getSingleItemFn,
    hashFn,
    updateItemFn,
  }).run();

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toEqual({
    status: 403,
    message: "Missing required scope 'notes:update'",
  });
  expect(updateItemFn).not.toHaveBeenCalled();
});

test("validateApiToken maps unknown auth failures to generic invalid-token message", async ({
  expect,
}) => {
  const getSingleItemFn = vi.fn().mockReturnValue(
    EitherAsync(async ({ liftEither }) => {
      return liftEither(Left("Object not found for key: secret"));
    }),
  );
  const hashFn = vi.fn();
  const updateItemFn = vi.fn();

  const result = await validateApiToken({
    request: makeRequest(
      "Bearer pat_sean.123e4567-e89b-12d3-a456-426614174000.secret",
    ),
    requiredScope: "notes:create",
    now: () => now,
    getSingleItemFn,
    hashFn,
    updateItemFn,
  }).run();

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toEqual({
    status: 401,
    message: "Invalid API token",
  });
});
