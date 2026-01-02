import { test, vi } from "vitest";
import { validateUserLoggedIn } from "./validate-user-logged-in";
import { Maybe } from "purify-ts/Maybe";

test("fails if getUserFn fails", async ({ expect }) => {
  const getUserFn = vi.fn().mockResolvedValue(Maybe.empty());

  const result = await validateUserLoggedIn({
    getUserFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("No user found");
});

test("fails is getUserFn returns null", async ({ expect }) => {
  const getUserFn = vi.fn().mockResolvedValue(Maybe.empty());

  const result = await validateUserLoggedIn({
    getUserFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("No user found");
});

test("returns user if succeeds", async ({ expect }) => {
  const user = { username: "username" };

  const getUserFn = vi.fn().mockResolvedValue(Maybe.of(user));

  const result = await validateUserLoggedIn({ getUserFn });

  // expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual(user);
});
