import { test, vi } from "vitest";
import { secureHashWithSalt } from "./secure-hash-with-salt";
import { Left, Right } from "purify-ts/Either";

test("fails if saltFn fails", async ({ expect }) => {
  const saltFn = vi.fn().mockReturnValue(Left("some error"));

  const result = await secureHashWithSalt({
    saltFn,
    value: "value",
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("fails if hashFn fails", async ({ expect }) => {
  const saltFn = vi.fn().mockReturnValue(Right("salt"));

  const hashFn = vi.fn().mockResolvedValue(Left("some error"));

  const result = await secureHashWithSalt({
    saltFn,
    hashFn,
    value: "value",
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("returns hash and salt if succeeds", async ({ expect }) => {
  const saltFn = vi.fn().mockReturnValue(Right("salt"));

  const hashFn = vi.fn().mockResolvedValue(Right("hash"));

  const result = await secureHashWithSalt({
    saltFn,
    hashFn,
    value: "value",
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual({ hash: "hash", salt: "salt" });
});
