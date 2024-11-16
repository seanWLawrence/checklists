import { test } from "vitest";
import { constantTimeStringComparison } from "./constant-time-string-comparison";

test("should return true for identical strings", ({ expect }) => {
  expect(constantTimeStringComparison("test", "test")).toBe(true);
});

test("should return false for strings of different lengths", ({ expect }) => {
  expect(constantTimeStringComparison("test", "testing")).toBe(false);
});

test("should return false for strings with same length but different content", ({
  expect,
}) => {
  expect(constantTimeStringComparison("test", "tost")).toBe(false);
});

test("should return true for empty strings", ({ expect }) => {
  expect(constantTimeStringComparison("", "")).toBe(true);
});

test("should return false for one empty string and one non-empty string", ({
  expect,
}) => {
  expect(constantTimeStringComparison("", "test")).toBe(false);
});

test("should return true for strings with special characters that are identical", ({
  expect,
}) => {
  expect(constantTimeStringComparison("t@st!", "t@st!")).toBe(true);
});

test("should return false for strings with special characters that are different", ({
  expect,
}) => {
  expect(constantTimeStringComparison("t@st!", "t@st?")).toBe(false);
});
