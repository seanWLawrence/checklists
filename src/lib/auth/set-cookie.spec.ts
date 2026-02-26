import { test, vi } from "vitest";
import { setCookie } from "./set-cookie";
import { FIFTEEN_MINUTES_IN_MILLISECONDS } from "@/lib/env.server";

const cookieName = "cookie name";
const value = "some value";
const expires = new Date(Date.now() + FIFTEEN_MINUTES_IN_MILLISECONDS);

test("sets cookie with expected secure params in production", async ({
  expect,
}) => {
  const setCookieFn = vi.fn();

  await setCookie({
    setCookieFn,
    cookieName,
    value,
    expires,
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
    },
  });
});
