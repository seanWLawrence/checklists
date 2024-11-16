import { test } from "vitest";
import { validateAud } from "./validate-aud";
import { Maybe } from "purify-ts/Maybe";

test("returns right for valid aud", ({ expect }) => {
  const expectedAud = "https://example.com";

  expect(
    validateAud({
      expectedAudMaybe: Maybe.of(expectedAud),
      actualAud: expectedAud,
    }).isRight(),
  ).toBe(true);
});

test("returns right if expected aud is missing", ({ expect }) => {
  expect(
    validateAud({
      expectedAudMaybe: Maybe.empty(),
      actualAud: "any aud",
    }).isRight(),
  ).toBe(true);
});

test("returns left for invalid aud", ({ expect }) => {
  const expectedAud = "https://example.com";

  expect(
    validateAud({
      expectedAudMaybe: Maybe.of(expectedAud),
      actualAud: "invalid aud",
    }).isLeft(),
  ).toBe(true);

  // Arrays not supported
  expect(
    validateAud({
      expectedAudMaybe: Maybe.of(expectedAud),
      actualAud: [expectedAud],
    }).isLeft(),
  ).toBe(true);

  expect(
    validateAud({
      expectedAudMaybe: Maybe.of(expectedAud),
      actualAud: undefined,
    }).isLeft(),
  ).toBe(true);
});
