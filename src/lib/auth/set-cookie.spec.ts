import { test, vi } from "vitest";
import { setCookie } from "./set-cookie";

const cookieName = "cookie name";
const value = "some value";
const expires = new Date(Date.now() + 1000);

test("sets cookie with expected secure params in production", async ({
  expect,
}) => {
  const setCookieFn = vi.fn();
  const domain = "example.com";

  await setCookie({
    setCookieFn,
    cookieName,
    value,
    expires,
    domain,
    isProductionFn: () => true,
  });

  expect(setCookieFn).toHaveBeenCalledWith({
    cookieName,
    value,
    options: {
      expires,
      secure: true,
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      domain,
    },
  });
});

test("sets cookie with expected secure params in development", ({ expect }) => {
  const setCookieFn = vi.fn();

  setCookie({
    setCookieFn,
    cookieName,
    value,
    expires,
    isProductionFn: () => false,
  });

  expect(setCookieFn).toHaveBeenCalledWith({
    cookieName,
    value,
    options: {
      expires,
      secure: false,
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      domain: undefined,
    },
  });
});
