import { test, vi } from "vitest";
import { Left, Right } from "purify-ts/Either";
import { Maybe } from "purify-ts/Maybe";

import { getUser } from "./get-user";

test("returns null if auth secret isnt set", async ({ expect }) => {
  const result = await getUser({ authSecret: Left("some error") });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe(null);
});

test("returns null if no access jwt is found", async ({ expect }) => {
  const getAccessCookieFn = vi.fn().mockReturnValue(Maybe.empty());

  const result = await getUser({
    authSecret: Right("secret"),
    getAccessCookieFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe(null);
});

test("returns null if access jwt isnt valid", async ({ expect }) => {
  const getAccessCookieFn = vi.fn().mockReturnValue(Maybe.of("jwt"));

  const validateAccessJwtFn = vi.fn().mockResolvedValue(Left("some error"));

  const result = await getUser({
    authSecret: Right("secret"),
    validateAccessJwtFn,
    getAccessCookieFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe(null);
});

test("returns null if access jwt doesnt contain a sub", async ({ expect }) => {
  const getAccessCookieFn = vi.fn().mockReturnValue(Maybe.of("jwt"));

  const validateAccessJwtFn = vi
    .fn()
    .mockResolvedValue(Right({ sub: undefined }));

  const result = await getUser({
    authSecret: Right("secret"),
    validateAccessJwtFn,
    getAccessCookieFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe(null);
});

test("returns user if has valid access jwt and sub", async ({ expect }) => {
  const username = "username";

  const getAccessCookieFn = vi.fn().mockReturnValue(Maybe.of("jwt"));

  const validateAccessJwtFn = vi
    .fn()
    .mockResolvedValue(Right({ sub: username }));

  const result = await getUser({
    authSecret: Right("secret"),
    validateAccessJwtFn,
    getAccessCookieFn,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract().username).toBe(username);
});
