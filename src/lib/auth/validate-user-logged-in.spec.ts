import { Left, Right } from "purify-ts/Either";
import { test, vi } from "vitest";
import { validateUserLoggedIn } from "./validate-user-logged-in";

test("fails if getUserFn fails", async ({ expect }) => {
  const getUserFn = vi.fn().mockResolvedValue(Left("some error"));

  const result = await validateUserLoggedIn({
    getUserFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("fails is getUserFn returns null", async ({ expect }) => {
  const getUserFn = vi.fn().mockResolvedValue(Right(null));

  const result = await validateUserLoggedIn({
    getUserFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("No user found");
});

test("returns user if succeeds", async ({ expect }) => {
  const user = { username: "username" };

  const getUserFn = vi.fn().mockResolvedValue(Right(user));

  const result = await validateUserLoggedIn({ getUserFn });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual(user);
});
