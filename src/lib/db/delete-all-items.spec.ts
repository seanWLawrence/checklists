import { test, vi } from "vitest";
import { deleteAllItems } from "./delete-all-items";
import { Left, Right } from "purify-ts/Either";

const user = { username: "username" };

test("fails if getClientFn fails", async ({ expect }) => {
  const getClientFn = vi.fn().mockReturnValue(Left("some error"));

  const result = await deleteAllItems({
    user,
    getClientFn,
    keys: ["user#username#value1"],
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toEqual("some error");
});

test("fails is client.del fails", async ({ expect }) => {
  const errorResponse = 0;

  const getClientFn = vi.fn().mockReturnValue(
    Right({
      del: vi.fn().mockResolvedValue(errorResponse),
    }),
  );

  const result = await deleteAllItems({
    user,
    getClientFn,
    keys: ["user#username#value1"],
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toMatch(/Failed to delete .*/);
});

test("returns void if succeeds", async ({ expect }) => {
  const successResponse = "success";

  const getClientFn = vi.fn().mockReturnValue(
    Right({
      del: vi.fn().mockResolvedValue(successResponse),
    }),
  );

  const result = await deleteAllItems({
    user,
    getClientFn,
    keys: ["user#username#value1"],
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toBeUndefined();
});

test("doesnt do anything if no keys", async ({ expect }) => {
  const getClientFn = vi.fn().mockReturnValue(Right({}));

  const result = await deleteAllItems({
    user,
    keys: [],
    getClientFn,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toBeUndefined();
  expect(getClientFn).not.toHaveBeenCalled();
});
