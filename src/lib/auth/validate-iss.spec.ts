import { test } from "vitest";
import { validateIss } from "./validate-iss";
import { Maybe } from "purify-ts/Maybe";

test("returns right for valid iss", ({ expect }) => {
  const expectedIss = "https://example.com";

  expect(
    validateIss({
      expectedIssMaybe: Maybe.of(expectedIss),
      actualIss: expectedIss,
    }).isRight(),
  ).toBe(true);
});

test("returns right if expected iss is missing", ({ expect }) => {
  expect(
    validateIss({
      expectedIssMaybe: Maybe.empty(),
      actualIss: "any iss",
    }).isRight(),
  ).toBe(true);
});

test("returns left for invalid iss", ({ expect }) => {
  const expectedIss = "https://example.com";

  expect(
    validateIss({
      expectedIssMaybe: Maybe.of(expectedIss),
      actualIss: "invalid iss",
    }).isLeft(),
  ).toBe(true);

  // Arrays not supported
  expect(
    validateIss({
      expectedIssMaybe: Maybe.of(expectedIss),
      actualIss: [expectedIss],
    }).isLeft(),
  ).toBe(true);

  expect(
    validateIss({
      expectedIssMaybe: Maybe.of(expectedIss),
      actualIss: undefined,
    }).isLeft(),
  ).toBe(true);
});
