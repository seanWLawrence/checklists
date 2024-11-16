import { test, vi } from "vitest";
import { randomChars, randomBytes } from "./random-chars";

test("fails if randomBytesFn throws", ({ expect }) => {
  const randomBytesFn = vi.fn().mockImplementation(() => {
    throw new Error("some error");
  });

  const result = randomChars({
    randomBytesFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBeInstanceOf(Error);
});

test("fails if randomBytesFn returns an empty buffer", ({ expect }) => {
  const randomBytesFn = vi.fn().mockReturnValue(new Uint8Array(0));

  const result = randomChars({
    randomBytesFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBeInstanceOf(Error);
});

test("fails if randomBytesFn returns an invalid value", ({ expect }) => {
  const randomBytesFn = vi.fn().mockReturnValue(new Array(0));

  const result = randomChars({
    randomBytesFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBeInstanceOf(Error);
});

test("returns a random string if succeeds", ({ expect }) => {
  const randomBytesFn = vi.fn().mockReturnValue(randomBytes());

  const result = randomChars({
    randomBytesFn,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual(expect.any(String));
});
