import { Mock, test, vi } from "vitest";
import { Left, Right } from "purify-ts/Either";

import { login } from "./login";
import { redirect } from "next/navigation";

const succeededAndCalledRedirectToHome = ({
  redirectFn,
}: {
  redirectFn: Mock;
}): boolean => {
  return (
    redirectFn.mock.calls.length === 1 &&
    redirectFn.mock.calls[0].length === 1 &&
    redirectFn.mock.calls[0][0] === "/"
  );
};

test("fails if cant get username or password", async ({ expect }) => {
  const redirectFn = vi.fn();

  const getStringFromFormDataFn = vi
    .fn()
    .mockReturnValueOnce(Left("some username error"))
    .mockReturnValueOnce(Left("some password error"));

  await login({
    formData: new FormData(),
    getStringFromFormDataFn,
    redirectFn: redirectFn as unknown as typeof redirect,
  });

  expect(succeededAndCalledRedirectToHome({ redirectFn })).toBe(false);

  await login({
    formData: new FormData(),
    getStringFromFormDataFn,
    redirectFn,
  });

  expect(succeededAndCalledRedirectToHome({ redirectFn })).toBe(false);
});

test("fails if cant get auth secret", async ({ expect }) => {
  const getStringFromFormDataFn = vi.fn().mockReturnValue(Right("some value"));

  const redirectFn = vi.fn();

  await login({
    formData: new FormData(),
    getStringFromFormDataFn,
    authSecret: Left("not found"),
    redirectFn: redirectFn as unknown as typeof redirect,
  });

  expect(succeededAndCalledRedirectToHome({ redirectFn })).toBe(false);
});

test("fails if password doesnt match auth secret", async ({ expect }) => {
  const getStringFromFormDataFn = vi
    .fn()
    .mockReturnValueOnce(Right("some value"))
    .mockReturnValueOnce(Right("some other secret"));

  const redirectFn = vi.fn();

  await login({
    formData: new FormData(),
    getStringFromFormDataFn,
    authSecret: Right("some secret"),
    redirectFn: redirectFn as unknown as typeof redirect,
  });

  expect(succeededAndCalledRedirectToHome({ redirectFn })).toBe(false);
});

test("fails if setAuthTokensAndCookies fails", async ({ expect }) => {
  const getStringFromFormDataFn = vi.fn().mockReturnValue(Right("some value"));

  const setAuthTokensAndCookiesFn = vi
    .fn()
    .mockResolvedValue(Left("some error"));

  const redirectFn = vi.fn();

  await login({
    formData: new FormData(),
    getStringFromFormDataFn,
    authSecret: Right("some value"),
    setAuthTokensAndCookiesFn,
    redirectFn: redirectFn as unknown as typeof redirect,
  });

  expect(succeededAndCalledRedirectToHome({ redirectFn })).toBe(false);
});

test("redirects to home on success", async ({ expect }) => {
  const getStringFromFormDataFn = vi.fn().mockReturnValue(Right("some value"));

  const redirectFn = vi.fn();

  await login({
    formData: new FormData(),
    getStringFromFormDataFn,
    authSecret: Right("some value"),
    setAuthTokensAndCookiesFn: vi.fn().mockResolvedValue(Right(void 0)),
    redirectFn: redirectFn as unknown as typeof redirect,
  });

  expect(redirectFn).toHaveBeenCalledTimes(1);
  expect(redirectFn).toHaveBeenCalledWith("/");
});
