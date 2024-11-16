import { test, vi } from "vitest";
import { handleAuth } from "./handle-auth";
import { Either, Left, Right } from "purify-ts/Either";
import { NextRequest } from "next/server";
import { MaybeAsync } from "purify-ts/MaybeAsync";
import { EitherAsync, Maybe } from "purify-ts";
import { getRefreshCookie } from "@/lib/auth/get-refresh-cookie";
import { user } from "@/factories/user.factory";

const authSecret = Either.of("authSecret");

test("does nothing if request is on login page", async ({ expect }) => {
  const redirectFn = vi.fn();

  await handleAuth({
    authSecret,
    request: {
      url: "/login",
      // We're not using the cookies here
      cookies: {} as NextRequest["cookies"],
    },
    redirectFn: redirectFn,
  });

  expect(redirectFn).not.toHaveBeenCalled();
});

test("redirects to login page if not logged in and viewing a page other than login", async ({
  expect,
}) => {
  const redirectFn = vi.fn();

  const validateUserLoggedInFn = vi
    .fn()
    .mockReturnValue(
      EitherAsync(async ({ throwE }) => throwE("not logged in")),
    );

  await handleAuth({
    authSecret,
    request: {
      url: "http://localhost:3000/not-login",
      // We're not using the cookies here
      cookies: {} as NextRequest["cookies"],
    },
    redirectFn,
    validateUserLoggedInFn,
  });

  expect(redirectFn).toHaveBeenCalled();
});

test("does nothing if logged in", async ({ expect }) => {
  const redirectFn = vi.fn();

  const validateUserLoggedInFn = vi
    .fn()
    .mockResolvedValue(Right({ username: "username" }));

  await handleAuth({
    authSecret,
    request: {
      url: "http://localhost:3000/login",
      // We're not using the cookies here
      cookies: {} as NextRequest["cookies"],
    },
    redirectFn: redirectFn,
    validateUserLoggedInFn,
  });

  expect(redirectFn).not.toHaveBeenCalled();
});

test("redirects to login if no refresh token", async ({ expect }) => {
  const validateUserLoggedInFn = vi
    .fn()
    .mockReturnValue(
      EitherAsync(async ({ throwE }) => throwE("not logged in")),
    );

  const getRefreshCookieFn = () =>
    MaybeAsync(async ({ liftMaybe }) => liftMaybe(Maybe.empty()));

  const redirectFn = vi.fn();

  await handleAuth({
    authSecret,
    request: {
      url: "http://localhost:3000/protected-page",
      // We're not using the cookies here since we're stubbing the get logic
      cookies: {} as NextRequest["cookies"],
    },
    validateUserLoggedInFn,
    getRefreshCookieFn: getRefreshCookieFn as typeof getRefreshCookie,
    redirectFn: redirectFn,
  });

  expect(redirectFn).toHaveBeenCalled();
});

test("redirects to login if refresh token isnt valid", async ({ expect }) => {
  const validateUserLoggedInFn = vi
    .fn()
    .mockReturnValue(
      EitherAsync(async ({ throwE }) => throwE("not logged in")),
    );

  const getRefreshCookieFn = () =>
    MaybeAsync(async ({ liftMaybe }) =>
      liftMaybe(Maybe.of({ value: "refreshToken", name: "name" })),
    );

  const validateRefreshTokenFn = vi.fn().mockResolvedValue(Left("some error"));

  const redirectFn = vi.fn();

  await handleAuth({
    authSecret,
    request: {
      url: "http://localhost:3000/protected-page",
      // We're not using the cookies here since we're stubbing the get logic
      cookies: {} as NextRequest["cookies"],
    },
    validateUserLoggedInFn,
    getRefreshCookieFn: getRefreshCookieFn as typeof getRefreshCookie,
    validateRefreshTokenFn,
    redirectFn: redirectFn,
  });

  expect(redirectFn).toHaveBeenCalled();
});

test("redirects to login if revokeRefreshTokenFn fails", async ({ expect }) => {
  const validateUserLoggedInFn = vi
    .fn()
    .mockReturnValue(
      EitherAsync(async ({ throwE }) => throwE("not logged in")),
    );

  const getRefreshCookieFn = () =>
    MaybeAsync(async ({ liftMaybe }) =>
      liftMaybe(Maybe.of({ value: "refreshToken", name: "name" })),
    );

  const validateRefreshTokenFn = vi.fn().mockResolvedValue(Right(user()));

  const revokeRefreshTokenFn = vi.fn().mockResolvedValue(Left("some error"));

  const redirectFn = vi.fn();

  await handleAuth({
    authSecret,
    request: {
      url: "http://localhost:3000/protected-page",
      // We're not using the cookies here since we're stubbing the get logic
      cookies: {} as NextRequest["cookies"],
    },
    validateUserLoggedInFn,
    getRefreshCookieFn: getRefreshCookieFn as typeof getRefreshCookie,
    validateRefreshTokenFn,
    revokeRefreshTokenFn,
    redirectFn: redirectFn,
  });

  expect(redirectFn).toHaveBeenCalled();
});

test("redirects to login if setAuthTokensAndCookiesFn fails", async ({
  expect,
}) => {
  const validateUserLoggedInFn = vi
    .fn()
    .mockReturnValue(
      EitherAsync(async ({ throwE }) => throwE("not logged in")),
    );

  const getRefreshCookieFn = () =>
    MaybeAsync(async ({ liftMaybe }) =>
      liftMaybe(Maybe.of({ value: "refreshToken", name: "name" })),
    );

  const validateRefreshTokenFn = vi.fn().mockResolvedValue(Right(user()));

  const revokeRefreshTokenFn = vi.fn().mockResolvedValue(Right({}));

  const setAuthTokensAndCookiesFn = vi
    .fn()
    .mockResolvedValue(Left("some error"));

  const redirectFn = vi.fn();

  await handleAuth({
    authSecret,
    request: {
      url: "http://localhost:3000/protected-page",
      // We're not using the cookies here since we're stubbing the get logic
      cookies: {} as NextRequest["cookies"],
    },
    validateUserLoggedInFn,
    getRefreshCookieFn: getRefreshCookieFn as typeof getRefreshCookie,
    validateRefreshTokenFn,
    revokeRefreshTokenFn,
    setAuthTokensAndCookiesFn,
    redirectFn,
  });

  expect(redirectFn).toHaveBeenCalled();
});

test("succeeds and returns user if all functions succeed", async ({
  expect,
}) => {
  const validateUserLoggedInFn = vi
    .fn()
    .mockReturnValue(
      EitherAsync(async ({ throwE }) => throwE("not logged in")),
    );

  const getRefreshCookieFn = () =>
    MaybeAsync(async ({ liftMaybe }) =>
      liftMaybe(Maybe.of({ value: "refreshToken", name: "name" })),
    );

  const validateRefreshTokenFn = vi.fn().mockResolvedValue(Right(user()));

  const revokeRefreshTokenFn = vi.fn().mockResolvedValue(Right({}));

  const setAuthTokensAndCookiesFn = vi.fn().mockResolvedValue(Right({}));

  const redirectFn = vi.fn();

  await handleAuth({
    authSecret,
    request: {
      url: "http://localhost:3000/protected-page",
      // We're not using the cookies here since we're stubbing the get logic
      cookies: {} as NextRequest["cookies"],
    },
    validateUserLoggedInFn,
    getRefreshCookieFn: getRefreshCookieFn as typeof getRefreshCookie,
    validateRefreshTokenFn,
    revokeRefreshTokenFn,
    setAuthTokensAndCookiesFn,
    redirectFn,
  });

  expect(redirectFn).not.toHaveBeenCalled();
});
