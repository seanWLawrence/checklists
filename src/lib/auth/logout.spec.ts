import { test, vi } from "vitest";
import { logout } from "./logout";
import { Left, Right } from "purify-ts/Either";
import { MaybeAsync } from "purify-ts/MaybeAsync";

test("skips revoking and redirects if user isnt found", async ({ expect }) => {
  const validateUserLoggedInFn = vi
    .fn()
    .mockResolvedValue(Left("No user found."));
  const revokeRefreshTokenFn = vi.fn();
  const revokeAccessTokenFn = vi.fn();
  const redirectFn = vi.fn();
  const revalidatePathFn = vi.fn();

  await logout({
    validateUserLoggedInFn,
    revokeRefreshTokenFn,
    revokeAccessTokenFn,
    // @ts-expect-error just for testing
    redirectFn,
    revalidatePathFn,
  });

  expect(revokeRefreshTokenFn).not.toHaveBeenCalled();
  expect(revokeAccessTokenFn).not.toHaveBeenCalled();
  expect(redirectFn).toHaveBeenCalledWith("/login");
});

test("fails if revokeRefreshTokenFn fails", async ({ expect }) => {
  const user = { username: "username" };
  const validateUserLoggedInFn = vi.fn().mockResolvedValue(Right(user));
  const getRefreshCookieFn = vi
    .fn()
    .mockReturnValue(MaybeAsync(async () => ({ value: "some token" })));
  const revokeRefreshTokenFn = vi.fn().mockResolvedValue(Left("some error"));
  const revokeAccessTokenFn = vi.fn();
  const redirectFn = vi.fn();
  const revalidatePathFn = vi.fn();

  await logout({
    validateUserLoggedInFn,
    getRefreshCookieFn,
    revokeRefreshTokenFn,
    revokeAccessTokenFn,
    // @ts-expect-error just for testing
    redirectFn,
    revalidatePathFn,
  });

  expect(getRefreshCookieFn).toHaveBeenCalled();
  expect(revokeRefreshTokenFn).toHaveBeenCalled();
  expect(revokeRefreshTokenFn).toHaveBeenCalledWith({ token: "some token" });
  expect(revokeAccessTokenFn).not.toHaveBeenCalled();
  expect(redirectFn).toHaveBeenCalledWith("/login");
});

test("deletes access and refresh cookies and redirects to login when user is found", async ({
  expect,
}) => {
  const user = { username: "username" };
  const validateUserLoggedInFn = vi.fn().mockResolvedValue(Right(user));
  const getRefreshCookieFn = vi
    .fn()
    .mockReturnValue(MaybeAsync(async () => ({ value: "some token" })));
  const revokeRefreshTokenFn = vi.fn().mockResolvedValue(Right(undefined));
  const revokeAccessTokenFn = vi.fn();
  const redirectFn = vi.fn();
  const revalidatePathFn = vi.fn();

  await logout({
    validateUserLoggedInFn,
    getRefreshCookieFn,
    revokeRefreshTokenFn,
    revokeAccessTokenFn,
    // @ts-expect-error just for testing
    redirectFn,
    revalidatePathFn,
  });

  expect(getRefreshCookieFn).toHaveBeenCalled();
  expect(revokeRefreshTokenFn).toHaveBeenCalled();
  expect(revokeRefreshTokenFn).toHaveBeenCalledWith({ token: "some token" });
  expect(revokeAccessTokenFn).toHaveBeenCalled();
  expect(redirectFn).toHaveBeenCalledWith("/login");
  expect(revalidatePathFn).toHaveBeenCalledWith("/", "layout");
});
