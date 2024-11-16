import { test } from "vitest";
import { validateJwt } from "./validate-jwt";
import { generateJwt } from "./generate-jwt";

const authSecret = "secret";
const user = {
  username: "username",
};
const expirationTime = "5m";

test("returns left if invalid jwt", async ({ expect }) => {
  const jwt = await generateJwt({ user, authSecret, expirationTime });

  const result = await validateJwt({ jwt: jwt.slice(1), authSecret });

  expect(result.isLeft()).toBe(true);

  const value = result.extract();

  expect(value).toBeInstanceOf(Error);
});

test("returns payload if is valid jwt", async ({ expect }) => {
  const jwt = await generateJwt({ user, authSecret, expirationTime });

  const result = await validateJwt({ jwt, authSecret });

  expect(result.isRight()).toBe(true);

  const value = result.extract();

  expect(value).toMatchObject({
    sub: user.username,
  });
});
