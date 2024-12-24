import { test, expect } from "vitest";
import { formatRelativeTime } from "./format-relative-time";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

test("should format dates in the past correctly", () => {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - MINUTE);
  const oneHourAgo = new Date(now.getTime() - HOUR);
  const oneDayAgo = new Date(now.getTime() - DAY);

  expect(formatRelativeTime(oneMinuteAgo)).toBe("1 minute ago");
  expect(formatRelativeTime(oneHourAgo)).toBe("1 hour ago");
  expect(formatRelativeTime(oneDayAgo)).toBe("yesterday");
});

test("should format dates in the future correctly", () => {
  const now = new Date();
  const inOneMinute = new Date(now.getTime() + MINUTE);
  const inOneHour = new Date(now.getTime() + HOUR);
  const inOneDay = new Date(now.getTime() + DAY);

  expect(formatRelativeTime(inOneMinute)).toBe("in 1 minute");
  expect(formatRelativeTime(inOneHour)).toBe("in 1 hour");
  expect(formatRelativeTime(inOneDay)).toBe("tomorrow");
});

test("should format dates with larger units correctly", () => {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - MONTH);
  const oneYearAgo = new Date(now.getTime() - YEAR);

  expect(formatRelativeTime(oneMonthAgo)).toBe("last month");
  expect(formatRelativeTime(oneYearAgo)).toBe("last year");
});

test("should handle edge cases correctly", () => {
  const now = new Date();
  expect(formatRelativeTime(now)).toBe("now");
});
