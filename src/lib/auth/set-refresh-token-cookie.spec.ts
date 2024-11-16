import { test, vi } from "vitest";
import { setRefreshTokenCookie } from "./set-refresh-token-cookie";
import { REFRESH_TOKEN_COOKIE_NAME } from "./auth.constants";

const token = "token";

test("sets cookie with expected params", ({ expect }) => {
  const setCookieFn = vi.fn();

  setRefreshTokenCookie({ token, setCookieFn });

  expect(setCookieFn).toHaveBeenCalledWith({
    cookieName: REFRESH_TOKEN_COOKIE_NAME,
    value: token,
    expires: expect.any(Date),
  });
});
