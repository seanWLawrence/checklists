import { test } from "vitest";
import { validateUserFromKey } from "./validate-user-from-key";

const user = { username: "username" };

test("fails is key doesnt contain the username in the beginning", ({
  expect,
}) => {
  const result = validateUserFromKey({
    user,
    key: "user#invalid#dataType",
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("Forbidden");
});

test("succeeds if key contains username", ({ expect }) => {
  const result = validateUserFromKey({
    user,
    key: "user#username#dataType",
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual(user);
});
