import { test, vi } from "vitest";
import { Key } from "../types";
import { Left, Right } from "purify-ts/Either";
import { expire } from "./expire";

const key: Key = "user#username#value";

test("fails if getClientFn fails", async ({ expect }) => {
  const result = await expire({
    key,
    numSecondsToExpire: 10,
    getClientFn: vi.fn().mockReturnValue(Left("some error")),
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("fails if expire calls fails", async ({ expect }) => {
  const expireMock = vi.fn().mockRejectedValue(new Error("some error"));

  const getClientFn = vi.fn().mockReturnValue(Right({ expire: expireMock }));

  const result = await expire({
    key,
    numSecondsToExpire: 10,
    getClientFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBeInstanceOf(Error);
  expect((result.extract() as Error).message).toBe("some error");
  expect(expireMock).toBeCalledWith(key, 10);
});

test("fails if expire returns 0", async ({ expect }) => {
  const expireMock = vi.fn().mockResolvedValue(0);

  const getClientFn = vi.fn().mockReturnValue(Right({ expire: expireMock }));

  const result = await expire({
    key,
    numSecondsToExpire: 10,
    getClientFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe(`Failed to expire '${key}'`);
});

test("returns undefined if succeeds", async ({ expect }) => {
  const expireMock = vi.fn().mockResolvedValue(1);

  const getClientFn = vi.fn().mockReturnValue(Right({ expire: expireMock }));

  const result = await expire({
    key,
    numSecondsToExpire: 10,
    getClientFn,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toBeUndefined();
});
