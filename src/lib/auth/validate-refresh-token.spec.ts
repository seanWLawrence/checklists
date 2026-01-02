import { test, vi } from "vitest";
import { Left, Right } from "purify-ts/Either";

import { validateRefreshToken } from "./validate-refresh-token";

const token = "some token";
const error = "some error";

test("fails if token isnt found in the database", async ({ expect }) => {
  const getSingleItemFn = vi.fn().mockResolvedValue(Left(error));

  const result = await validateRefreshToken({ token, getSingleItemFn });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe(error);
});

test("fails if the token hash fails", async ({ expect }) => {
  const getSingleItemFn = vi
    .fn()
    .mockResolvedValue(Right({ hash: "some hash", salt: "some salt" }));

  const secureHashFn = vi.fn().mockResolvedValue(Left("some error"));

  const result = await validateRefreshToken({
    token,
    getSingleItemFn,
    secureHashFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe(error);
});

test("fails if the token hash doesnt match", async ({ expect }) => {
  const getSingleItemFn = vi
    .fn()
    .mockResolvedValue(Right({ hash: "some hash", salt: "some salt" }));

  const secureHashFn = vi
    .fn()
    .mockResolvedValue(Right({ hash: "some hash 2" }));

  const result = await validateRefreshToken({
    token,
    getSingleItemFn,
    secureHashFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toContain("doesn't match");
});

test("fails if the token was issued more than 30 days ago", async ({
  expect,
}) => {
  const getSingleItemFn = vi.fn().mockResolvedValue(
    Right({
      hash: "some hash",
      salt: "some salt",
      createdAtIso: new Date(1, 1, 2000),
    }),
  );

  const secureHashFn = vi.fn().mockResolvedValue(Right({ hash: "some hash" }));

  const result = await validateRefreshToken({
    token,
    getSingleItemFn,
    secureHashFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toContain("expired");
});

test("returns refresh token if succeeds", async ({ expect }) => {
  const user = { username: "username" };

  const getSingleItemFn = vi.fn().mockResolvedValue(
    Right({
      hash: "some hash",
      salt: "some salt",
      createdAtIso: new Date(),
      user,
    }),
  );

  const secureHashFn = vi.fn().mockResolvedValue(Right({ hash: "some hash" }));

  const result = await validateRefreshToken({
    token,
    getSingleItemFn,
    secureHashFn,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toMatchObject({ user });
});
