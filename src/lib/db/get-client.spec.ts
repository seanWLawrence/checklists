import { beforeEach, test, vi } from "vitest";
import { __clearClientCache_forTestingOnly, getClient } from "./get-client";

const value = "value";

beforeEach(() => {
  __clearClientCache_forTestingOnly();
});

test("caches prod client on subsequent requests", async ({ expect }) => {
  const getProdClientFn = vi.fn().mockReturnValue(value);

  vi.stubEnv("NODE_ENV", "production");

  getClient({
    getProdClientFn,
  });

  const result = getClient({
    getProdClientFn,
  });

  expect(getProdClientFn).toBeCalledTimes(1);
  expect(result.isRight()).toBe(true);
  expect(result.extract()).toBe(value);
});

test("caches dev client on subsequent requests", async ({ expect }) => {
  const getDevClientFn = vi.fn().mockReturnValue(value);

  vi.stubEnv("NODE_ENV", "development");

  getClient({
    getDevClientFn,
  });

  const result = getClient({
    getDevClientFn,
  });

  expect(getDevClientFn).toBeCalledTimes(1);
  expect(result.isRight()).toBe(true);
  expect(result.extract()).toBe(value);
});
