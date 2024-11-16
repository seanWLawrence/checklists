import { test, vi } from "vitest";

import { setAccessJwtCookie } from "./set-access-jwt-cookie";
import { ACCESS_JWT_COOKIE_NAME } from "./auth.constants";

const value = "jwt";

test("sets cookie with expected params", ({ expect }) => {
  const setJwtCookieFn = vi.fn();

  setAccessJwtCookie({ jwt: value, setJwtCookieFn });

  expect(setJwtCookieFn).toHaveBeenCalledWith({
    cookieName: ACCESS_JWT_COOKIE_NAME,
    value,
    expires: expect.any(Date),
  });
});
