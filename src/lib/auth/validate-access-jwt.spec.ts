import { test, vi } from "vitest";
import { Left, Right } from "purify-ts/Either";

import { validateAccessJwt } from "./validate-access-jwt";

const authSecret = "secret";
const jwt = "jwt";
const error = "some error";

test("fails if refresh jwt is invalid", async ({ expect }) => {
  const validateJwtFn = vi.fn().mockResolvedValue(Left(error));

  const result = await validateAccessJwt({
    jwt,
    authSecret,
    validateJwtFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe(error);
});

test("fails if iss is invalid", async ({ expect }) => {
  const error = "some error";

  const validateJwtFn = vi.fn().mockResolvedValue(Right({ iss: "invalid" }));
  const validateIssFn = vi.fn().mockReturnValue(Left(error));

  const result = await validateAccessJwt({
    jwt,
    authSecret,
    validateJwtFn,
    validateIssFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe(error);
});

test("fails if aud is invalid", async ({ expect }) => {
  const validateJwtFn = vi
    .fn()
    .mockResolvedValue(Right({ iss: "iss", aud: "aud" }));
  const validateIssFn = vi.fn().mockReturnValue(Right("iss"));
  const validateAudFn = vi.fn().mockReturnValue(Left(error));

  const result = await validateAccessJwt({
    jwt,
    authSecret,
    validateJwtFn,
    validateIssFn,
    validateAudFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe(error);
});

test("fails if issuedAt is invalid", async ({ expect }) => {
  const validateJwtFn = vi
    .fn()
    .mockResolvedValue(Right({ iss: "iss", aud: "aud" }));
  const validateIssFn = vi.fn().mockReturnValue(Right("iss"));
  const validateAudFn = vi.fn().mockReturnValue(Right("aud"));
  const validateIssuedAtFn = vi.fn().mockReturnValue(Left(error));

  const result = await validateAccessJwt({
    jwt,
    authSecret,
    validateJwtFn,
    validateIssFn,
    validateAudFn,
    validateIssuedAtFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe(error);
});

test("succeeds if all validations pass", async ({ expect }) => {
  const payload = { iss: "iss", aud: "aud", issuedAt: 0 };

  const validateJwtFn = vi.fn().mockResolvedValue(Right(payload));
  const validateIssFn = vi.fn().mockReturnValue(Right("iss"));
  const validateAudFn = vi.fn().mockReturnValue(Right("aud"));
  const validateIssuedAtFn = vi.fn().mockReturnValue(Right(0));

  const result = await validateAccessJwt({
    jwt,
    authSecret,
    validateJwtFn,
    validateIssFn,
    validateAudFn,
    validateIssuedAtFn,
  });

  expect(result.extract()).toBe(payload);
  expect(result.isRight()).toBe(true);
});
