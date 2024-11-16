import { test } from "vitest";
import { validateIssuedAt } from "./validate-iat";

const maxValidMilliIssuedFromNow = 1000;

test("returns left for missing iat", ({ expect }) => {
  const result = validateIssuedAt({
    iat: undefined,
    maxValidMilliIssuedFromNow: 0,
  });

  expect(result.isLeft()).toBe(true);

  expect(result.extract()).toBe("No iat");
});

test("returns left if iat was set more than maxValidMilliIssuedFromNow", ({
  expect,
}) => {
  const result = validateIssuedAt({
    iat: Date.now() - maxValidMilliIssuedFromNow - 1,
    maxValidMilliIssuedFromNow,
  });

  expect(result.isLeft()).toBe(true);

  expect(result.extract()).toBe("iat issued longer ago than expected");
});

test("returns right if iat was issued less than or equal to maxValidMilliIssuedFromNow", ({
  expect,
}) => {
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
});
