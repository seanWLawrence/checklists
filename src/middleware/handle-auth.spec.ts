import { test, vi } from "vitest";
import { handleAuth } from "./handle-auth";
import { Either, Left, Right } from "purify-ts/Either";
import { NextRequest } from "next/server";
import { MaybeAsync } from "purify-ts/MaybeAsync";
import { EitherAsync, Maybe } from "purify-ts";
import { getRefreshCookie } from "@/lib/auth/get-refresh-cookie";
import { user } from "@/factories/user.factory";

const authSecret = Either.of("authSecret");

test("should continue uninterrupted if trying to log in", async ({
  expect,
}) => {
  const validateUserLoggedInFn = vi
    .fn()
    .mockReturnValue(
      EitherAsync(async ({ throwE }) => throwE("not logged in")),
    );

  const nextFn = vi.fn();
  const redirectFn = vi.fn();

  await handleAuth({
    authSecret,
    request: {
      url: "http://localhost:3000/login",
      // We're not using the cookies here
      cookies: {} as NextRequest["cookies"],
    },
    validateUserLoggedInFn,
    nextFn,
    redirectFn,
  });

  expect(nextFn).toHaveBeenCalled();
  expect(redirectFn).not.toHaveBeenCalled();
});

test("should continue uninterrupted if already logged in and doing a request outside of the login page", async ({
  expect,
}) => {
  const redirectFn = vi.fn();
  const nextFn = vi.fn();

  const validateUserLoggedInFn = vi
    .fn()
    .mockReturnValue(
      EitherAsync(async ({ liftEither }) => liftEither(Either.of(user()))),
    );

  await handleAuth({
    authSecret,
    request: {
      url: "http://localhost:3000/not-login",
      // We're not using the cookies here
      cookies: {} as NextRequest["cookies"],
    },
    validateUserLoggedInFn,
    redirectFn,
    nextFn,
  });

  expect(redirectFn).not.toHaveBeenCalled();
  expect(nextFn).toHaveBeenCalled();
});

test("redirects to home if request is on login page but user is logged in", async ({
  expect,
}) => {
  const redirectFn = vi.fn();

  const validateUserLoggedInFn = vi
    .fn()
    .mockReturnValue(
      EitherAsync(async ({ liftEither }) => liftEither(Either.of(user()))),
    );

  await handleAuth({
    authSecret,
    request: {
      url: "http://localhost:3000/login",
      // We're not using the cookies here
      cookies: {} as NextRequest["cookies"],
    },
    redirectFn,
    validateUserLoggedInFn,
  });

  expect(redirectFn).toHaveBeenCalledWith(
    new URL("/", "http://localhost:3000"),
  );
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

  expect(redirectFn).toHaveBeenCalledWith(
    new URL("/login", "http://localhost:3000"),
  );
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
    redirectFn,
  });

  expect(redirectFn).toHaveBeenCalledWith(
    new URL("/login", "http://localhost:3000"),
  );
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
    redirectFn,
  });

  expect(redirectFn).toHaveBeenCalledWith(
    new URL("/login", "http://localhost:3000"),
  );
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

test("succeeds and returns user if wasnt logged in, but has refresh token and succeeds with getting an access token", async ({
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
  const nextFn = vi.fn();

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
    nextFn,
  });

  expect(nextFn).toHaveBeenCalled();
  expect(redirectFn).not.toHaveBeenCalled();
});
