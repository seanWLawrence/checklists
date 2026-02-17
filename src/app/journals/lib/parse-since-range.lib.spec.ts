import { test } from "vitest";
import { parseSinceRange } from "./parse-since-range.lib";

test("parseSinceRange succeeds for a valid inclusive range", ({ expect }) => {
  const result = parseSinceRange("2026-01-01to2026-01-31");

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual({
    since: "2026-01-01to2026-01-31",
    from: "2026-01-01",
    to: "2026-01-31",
  });
});

test("parseSinceRange rejects invalid calendar dates", ({ expect }) => {
  const result = parseSinceRange("2026-02-30to2026-03-01");

  expect(result.isLeft()).toBe(true);
});

test("parseSinceRange rejects ranges where from is after to", ({ expect }) => {
  const result = parseSinceRange("2026-02-02to2026-02-01");

  expect(result.isLeft()).toBe(true);
  expect(String(result.extract())).toContain("is after to");
});
