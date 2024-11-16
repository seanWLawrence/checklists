import { test } from "vitest";
import { Maybe } from "purify-ts/Maybe";

import { generateJwt } from "./generate-jwt";
import { validateJwt } from "./validate-jwt";
import { user } from "@/factories/user.factory";

test("creates jwt token with custom expiration time", async ({ expect }) => {
  const expirationTime = "5m";
  const authSecret = "secret";

  const jwt = await generateJwt({ user: user(), expirationTime, authSecret });
  const decryptedJwt = await validateJwt({ jwt, authSecret });

  if (decryptedJwt.isRight()) {
    expect(decryptedJwt.extract().exp).toEqual(expect.any(Number));
    return;
  }

  expect.fail("invalid jwt");
});

test("creates jwt token with iss or aud if either is available ", async ({
  expect,
}) => {
  const expirationTime = "5m";
  const authSecret = "secret";

  const jwt = await generateJwt({
    user: user(),
    expirationTime,
    authSecret,
    iss: Maybe.of("iss"),
    aud: Maybe.of("aud"),
  });
  const decryptedJwt = await validateJwt({ jwt, authSecret });

  if (decryptedJwt.isRight()) {
    expect(decryptedJwt.extract().aud).toBe("aud");
    expect(decryptedJwt.extract().iss).toBe("iss");
    return;
  }

  expect.fail("invalid jwt");
});

test("skips setting aud and/or iss if unavailable ", async ({ expect }) => {
  const expirationTime = "5m";
  const authSecret = "secret";

  const jwt = await generateJwt({
    user: user(),
    expirationTime,
    authSecret,
    aud: Maybe.empty(),
    iss: Maybe.empty(),
  });
  const decryptedJwt = await validateJwt({ jwt, authSecret });

  if (decryptedJwt.isRight()) {
    expect(decryptedJwt.extract().aud).toBeUndefined();
    expect(decryptedJwt.extract().iss).toBeUndefined();
    return;
  }

  expect.fail("invalid jwt");
});
