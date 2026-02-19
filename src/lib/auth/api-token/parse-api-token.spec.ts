import { test } from "vitest";

import {
  parseApiToken,
  parseBearerTokenFromAuthorizationHeader,
} from "./parse-api-token";

test("parseBearerTokenFromAuthorizationHeader parses a bearer token", ({
  expect,
}) => {
  const result = parseBearerTokenFromAuthorizationHeader("Bearer abc123");

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toBe("abc123");
});

test("parseApiToken parses a valid token payload", ({ expect }) => {
  const result = parseApiToken(
    "pat_alice.123e4567-e89b-12d3-a456-426614174000.secret",
  );

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual({
    username: "alice",
    id: "123e4567-e89b-12d3-a456-426614174000",
    secret: "secret",
  });
});

test("parseApiToken rejects invalid token payload", ({ expect }) => {
  const result = parseApiToken("slpat_missing-parts");

  expect(result.isLeft()).toBe(true);
});
