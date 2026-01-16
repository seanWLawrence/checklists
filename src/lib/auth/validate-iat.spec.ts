import { test, vi } from "vitest";
import { validateIssuedAt } from "./validate-iat";

const maxValidMilliIssuedFromNow = 1000;
const BASE_TIME = new Date("2020-01-01T00:00:00.000Z");

test("returns left for missing iat", ({ expect }) => {
  vi.useFakeTimers();
  vi.setSystemTime(BASE_TIME);

  const result = validateIssuedAt({
    iat: undefined,
    maxValidMilliIssuedFromNow: 0,
  });

  expect(result.isLeft()).toBe(true);

  expect(result.extract()).toBe("No iat");

  vi.useRealTimers();
});

test("returns left if iat was set more than maxValidMilliIssuedFromNow", ({
  expect,
}) => {
  vi.useFakeTimers();
  vi.setSystemTime(BASE_TIME);

  const result = validateIssuedAt({
    iat: Date.now() - maxValidMilliIssuedFromNow - 1,
    maxValidMilliIssuedFromNow,
  });

  expect(result.isLeft()).toBe(true);

  expect(result.extract()).toBe("iat issued longer ago than expected");

  vi.useRealTimers();
});

test("returns right if iat was issued less than or equal to maxValidMilliIssuedFromNow", ({
  expect,
}) => {
  vi.useFakeTimers();
  vi.setSystemTime(BASE_TIME);

  expect(
    validateIssuedAt({
      iat: Date.now() - maxValidMilliIssuedFromNow + 1,
      maxValidMilliIssuedFromNow,
    }).isRight(),
  ).toBe(true);

  expect(
    validateIssuedAt({
      iat: Date.now() - maxValidMilliIssuedFromNow,
      maxValidMilliIssuedFromNow,
    }).isRight(),
  ).toBe(true);

  vi.useRealTimers();
});
