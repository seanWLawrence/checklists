import { test, vi } from "vitest";
import { logout } from "./logout";
import { Left, Right } from "purify-ts/Either";
import { MaybeAsync } from "purify-ts";

test("skips revoking and redirects if user isnt found", async ({ expect }) => {
  const getUserFn = vi.fn().mockResolvedValue(Left("some error"));
  const revokeRefreshTokenFn = vi.fn();
  const revokeAccessTokenFn = vi.fn();
  const redirectFn = vi.fn();

  await logout({
    getUserFn,
    revokeRefreshTokenFn,
    revokeAccessTokenFn,
    // @ts-expect-error just for testing
    redirectFn,
  });

  expect(revokeRefreshTokenFn).not.toHaveBeenCalled();
  expect(revokeAccessTokenFn).not.toHaveBeenCalled();
  expect(redirectFn).toHaveBeenCalledWith("/login");
});

test("fails if revokeRefreshTokenFn fails", async ({ expect }) => {
  const user = { username: "username" };
  const getUserFn = vi.fn().mockResolvedValue(Right(user));
  const getRefreshCookieFn = vi
    .fn()
    .mockReturnValue(MaybeAsync(async () => ({ value: "some token" })));
  const revokeRefreshTokenFn = vi.fn().mockResolvedValue(Left("some error"));
  const revokeAccessTokenFn = vi.fn();
  const redirectFn = vi.fn();

  await logout({
    getUserFn,
    getRefreshCookieFn,
    revokeRefreshTokenFn,
    revokeAccessTokenFn,
    // @ts-expect-error just for testing
    redirectFn,
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
  const getUserFn = vi.fn().mockResolvedValue(Right(user));
  const getRefreshCookieFn = vi
    .fn()
    .mockReturnValue(MaybeAsync(async () => ({ value: "some token" })));
  const revokeRefreshTokenFn = vi.fn().mockResolvedValue(Right(undefined));
  const revokeAccessTokenFn = vi.fn();
  const redirectFn = vi.fn();

  await logout({
    getUserFn,
    getRefreshCookieFn,
    revokeRefreshTokenFn,
    revokeAccessTokenFn,
    // @ts-expect-error just for testing
    redirectFn,
  });

  expect(getRefreshCookieFn).toHaveBeenCalled();
  expect(revokeRefreshTokenFn).toHaveBeenCalled();
  expect(revokeRefreshTokenFn).toHaveBeenCalledWith({ token: "some token" });
  expect(revokeAccessTokenFn).toHaveBeenCalled();
  expect(redirectFn).toHaveBeenCalledWith("/login");
});
