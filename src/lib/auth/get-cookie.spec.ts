import { test, vi } from "vitest";
import { getCookie } from "./get-cookie";
import { Maybe } from "purify-ts/Maybe";

const name = "name";
const value = "value";

test("returns cookie from request if available", async ({ expect }) => {
  const get = vi.fn().mockReturnValue(value);

  const request = {
    cookies: { get },
  };

  const getCookieFromHeadersFn = vi.fn();

  const result = await getCookie({
    name,
    // @ts-expect-error Skipping the rest of the interface for testing only
    request,
    getCookieFromHeadersFn,
  });

  // expect(get).toBeCalledWith(name);
  expect(result.extract()).toBe(value);
});

test("returns cookie from headers if available", async ({ expect }) => {
  const get = vi.fn().mockReturnValue(undefined);

  const request = {
    cookies: { get },
  };

  const getCookieFromHeadersFn = vi.fn().mockResolvedValue(Maybe.of(value));

  const result = await getCookie({
    name,
    // @ts-expect-error Skipping the rest of the interface for testing only
    request,
    getCookieFromHeadersFn,
  });

  expect(get).toBeCalledWith(name);
  expect(getCookieFromHeadersFn).toBeCalledWith({ name });
  expect(result.extract()).toBe(value);
});

test("returns empty cookie if not available", async ({ expect }) => {
  const get = vi.fn().mockReturnValue(undefined);

  const request = {
    cookies: {
      get,
    },
  };

  const getCookieFromHeadersFn = vi.fn().mockResolvedValue(Maybe.empty());

  const result = await getCookie({
    name,
    // @ts-expect-error Skipping the rest of the interface for testing only
    request,
    getCookieFromHeadersFn,
  });

  expect(get).toBeCalledWith(name);
  expect(getCookieFromHeadersFn).toBeCalledWith({ name });
  expect(result.isNothing()).toBe(true);
});
