import { Mock, test, vi } from "vitest";
import { Left, Right } from "purify-ts/Either";

import { login } from "./login";
import { redirect } from "next/navigation";
import { UserCredentials } from "../types";

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
    // @ts-expect-error just for testing
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

test("fails if user credentials arent found", async ({ expect }) => {
  const getStringFromFormDataFn = vi
    .fn()
    .mockReturnValueOnce(Right("some value"))
    .mockReturnValueOnce(Right("some other secret"));

  const getSingleItemFn = vi.fn().mockResolvedValue(Left("not found"));

  const redirectFn = vi.fn();

  await login({
    formData: new FormData(),
    getStringFromFormDataFn,
    authSecret: Right("some secret"),
    getSingleItemFn,
    redirectFn: redirectFn as unknown as typeof redirect,
  });

  expect(succeededAndCalledRedirectToHome({ redirectFn })).toBe(false);
});

test("fails if password hash fails", async ({ expect }) => {
  const getStringFromFormDataFn = vi
    .fn()
    .mockReturnValueOnce(Right("some value"))
    .mockReturnValueOnce(Right("some other secret"));

  const getSingleItemFn = vi.fn().mockResolvedValue(
    Right({
      passwordHash: "some hash",
      salt: "some salt",
    } satisfies UserCredentials),
  );

  const secureHashFn = vi.fn().mockResolvedValue(Left("some error"));

  const redirectFn = vi.fn();

  await login({
    formData: new FormData(),
    getStringFromFormDataFn,
    authSecret: Right("some secret"),
    getSingleItemFn,
    secureHashFn,
    redirectFn: redirectFn as unknown as typeof redirect,
  });

  expect(succeededAndCalledRedirectToHome({ redirectFn })).toBe(false);
});

test("fails if passwordHash doesnt match user credentials password hash", async ({
  expect,
}) => {
  const getStringFromFormDataFn = vi
    .fn()
    .mockReturnValueOnce(Right("some value"))
    .mockReturnValueOnce(Right("some other secret"));

  const getSingleItemFn = vi.fn().mockResolvedValue(
    Right({
      passwordHash: "some hash",
      salt: "some salt",
    } satisfies UserCredentials),
  );

  const secureHashFn = vi
    .fn()
    .mockResolvedValue(
      Right({ hash: "some different hash", salt: "some salt" }),
    );

  const redirectFn = vi.fn();

  await login({
    formData: new FormData(),
    getStringFromFormDataFn,
    authSecret: Right("some secret"),
    getSingleItemFn,
    secureHashFn,
    redirectFn: redirectFn as unknown as typeof redirect,
  });

  expect(succeededAndCalledRedirectToHome({ redirectFn })).toBe(false);
});

test("fails if setAuthTokensAndCookies fails", async ({ expect }) => {
  const getStringFromFormDataFn = vi.fn().mockReturnValue(Right("some value"));

  const getSingleItemFn = vi.fn().mockResolvedValue(
    Right({
      passwordHash: "some hash",
      salt: "some salt",
    } satisfies UserCredentials),
  );

  const secureHashFn = vi
    .fn()
    .mockResolvedValue(Right({ hash: "some hash", salt: "some salt" }));

  const setAuthTokensAndCookiesFn = vi
    .fn()
    .mockResolvedValue(Left("some error"));

  const redirectFn = vi.fn();

  await login({
    formData: new FormData(),
    getStringFromFormDataFn,
    authSecret: Right("some value"),
    getSingleItemFn,
    secureHashFn,
    setAuthTokensAndCookiesFn,
    redirectFn: redirectFn as unknown as typeof redirect,
  });

  expect(succeededAndCalledRedirectToHome({ redirectFn })).toBe(false);
});

test("redirects to home on success", async ({ expect }) => {
  const getStringFromFormDataFn = vi
    .fn()
    .mockReturnValueOnce(Right("some value"))
    .mockReturnValueOnce(Right("some password"));

  const getSingleItemFn = vi.fn().mockResolvedValue(
    Right({
      passwordHash: "some hash",
      salt: "some salt",
    } satisfies UserCredentials),
  );

  const secureHashFn = vi
    .fn()
    .mockResolvedValue(Right({ hash: "some hash", salt: "some salt" }));

  const redirectFn = vi.fn();
  const revalidatePathFn = vi.fn();

  await login({
    formData: new FormData(),
    getStringFromFormDataFn,
    authSecret: Right("some value"),
    getSingleItemFn,
    secureHashFn,
    setAuthTokensAndCookiesFn: vi.fn().mockResolvedValue(Right(void 0)),
    redirectFn: redirectFn as unknown as typeof redirect,
    revalidatePathFn,
  });

  expect(redirectFn).toHaveBeenCalledTimes(1);
  expect(redirectFn).toHaveBeenCalledWith("/");
  expect(revalidatePathFn).toHaveBeenCalledWith("/", "layout");
});
