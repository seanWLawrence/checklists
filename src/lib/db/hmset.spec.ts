import { test, vi } from "vitest";
import { hmset } from "./hmset";
import { Key, User } from "../types";
import { Left, Right } from "purify-ts/Either";

const key: Key = "user#username#key";
const item: User = { username: "username" };

test("fails if getClientFn fails", async ({ expect }) => {
  const getClientFn = vi.fn().mockReturnValue(Left("some error"));

  const result = await hmset({
    item,
    key,
    getClientFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("fails if hmset doesnt return OK", async ({ expect }) => {
  const getClientFn = vi
    .fn()
    .mockReturnValue(Right({ hmset: vi.fn().mockResolvedValue("some error") }));

  const result = await hmset({
    item,
    key,
    getClientFn,
  });

  expect(result.isLeft()).toBe(true);
});

test("fails if hmset throws error", async ({ expect }) => {
  const getClientFn = vi
    .fn()
    .mockReturnValue(Right({ hmset: vi.fn().mockRejectedValue("some error") }));

  const result = await hmset({
    item,
    key,
    getClientFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("returns void if succeeds", async ({ expect }) => {
  const getClientFn = vi
    .fn()
    .mockReturnValue(Right({ hmset: vi.fn().mockResolvedValue("OK") }));

  const result = await hmset({
    item,
    key,
    getClientFn,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toBe(void 0);
});
