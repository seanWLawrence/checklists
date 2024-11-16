import { test, vi } from "vitest";
import { Left, Right } from "purify-ts/Either";

import { revokeRefreshToken } from "./revoke-refresh-token";

const token = "token";

test("fails if deleteAllFn fails", async ({ expect }) => {
  const error = Left("some error");
  const deleteAllItemsFn = vi.fn().mockResolvedValue(error);
  const deleteCookieFn = vi.fn();
  const result = await revokeRefreshToken({
    token,
    deleteAllItemsFn,
    deleteCookieFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toEqual("some error");
  expect(deleteCookieFn).not.toBeCalled();
});

test("deletes cookie and refreseh tokken hash from db if successful", async ({
  expect,
}) => {
  const deleteAllItemsFn = vi.fn().mockResolvedValue(Right(null));
  const deleteCookieFn = vi.fn();

  const result = await revokeRefreshToken({
    token,
    deleteAllItemsFn,
    deleteCookieFn,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toBeUndefined();
  expect(deleteCookieFn).toBeCalled();
  expect(deleteAllItemsFn).toBeCalled();
});
