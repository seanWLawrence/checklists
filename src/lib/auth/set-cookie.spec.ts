import { test, vi } from "vitest";
import { setCookie } from "./set-cookie";
import { DOMAIN } from "../constants";

const cookieName = "cookie name";
const value = "some value";
const expires = new Date(Date.now() + 1000);

test("sets cookie with expected secure params in production", async ({
  expect,
}) => {
  const setCookieFn = vi.fn();

  vi.stubEnv("NODE_ENV", "production");

  await setCookie({
    setCookieFn,
    cookieName,
    value,
    expires,
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
      domain: DOMAIN,
    },
  });
});

test("sets cookie with expected secure params in development", ({ expect }) => {
  const setCookieFn = vi.fn();

  vi.stubEnv("NODE_ENV", "development");

  setCookie({
    setCookieFn,
    cookieName,
    value,
    expires,
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
      domain: DOMAIN,
    },
  });
});
