import { test, vi } from "vitest";
import { Right } from "purify-ts/Either";

import { enforceRateLimit } from "./enforce-rate-limit";

test("enforceRateLimit allows request under limit and sets expiry on first hit", async ({
  expect,
}) => {
  const client = {
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  };
  const getClientFn = vi.fn().mockReturnValue(Right(client));

  const result = await enforceRateLimit({
    key: "rateLimit#publicApi#token#abc",
    limit: 10,
    windowSeconds: 60,
    getClientFn,
  }).run();

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual({
    allowed: true,
    retryAfterSeconds: 60,
    remaining: 9,
  });
  expect(client.expire).toHaveBeenCalledWith(
    "rateLimit#publicApi#token#abc",
    60,
  );
});

test("enforceRateLimit blocks requests over limit", async ({ expect }) => {
  const client = {
    incr: vi.fn().mockResolvedValue(11),
    expire: vi.fn(),
  };
  const getClientFn = vi.fn().mockReturnValue(Right(client));

  const result = await enforceRateLimit({
    key: "rateLimit#publicApi#token#abc",
    limit: 10,
    windowSeconds: 60,
    getClientFn,
  }).run();

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual({
    allowed: false,
    retryAfterSeconds: 60,
    remaining: 0,
  });
  expect(client.expire).not.toHaveBeenCalled();
});
