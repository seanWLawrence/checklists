import { vi, test } from "vitest";
import { createItem } from "./create-item";
import { Left, Right } from "purify-ts/Either";
import { Key, User } from "../types";

const getKeyFn = (): Key => "user#username#key";

const item: User = {
  username: "username",
};

const user = item;

const decoder = User;

test("fails if hmsetFn fails", async ({ expect }) => {
  const validateUserFromKeyFn = vi.fn().mockReturnValue(Right({}));

  const hmsetFn = vi.fn().mockResolvedValue(Left("some error"));

  const result = await createItem({
    validateUserFromKeyFn,
    hmsetFn,
    getKeyFn,
    user,
    item,
    decoder,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("succeeds if nothing fails", async ({ expect }) => {
  const validateUserFromKeyFn = vi.fn().mockReturnValue(Right({}));

  const hmsetFn = vi.fn().mockResolvedValue(Right(void 0));

  const result = await createItem({
    validateUserFromKeyFn,
    hmsetFn,
    getKeyFn,
    item,
    user,
    decoder,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toMatchObject(item);
});
