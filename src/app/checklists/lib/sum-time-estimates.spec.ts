import { test } from "vitest";
import { sumTimeEstimates } from "./sum-time-estimates";

test("returns in increments of 5m if less than 58m", ({ expect }) => {
  expect(sumTimeEstimates(["5m"])).toBe("5m");
  expect(sumTimeEstimates(["5m", "4m", "1m"])).toBe("10m");
  expect(sumTimeEstimates(["8m"])).toBe("10m");
  expect(sumTimeEstimates(["44m"])).toBe("45m");
  expect(sumTimeEstimates(["57m"])).toBe("55m");
});

test("returns in increments of 30m if greater than or equal to an hour", ({
  expect,
}) => {
  expect(sumTimeEstimates(["58m"])).toBe("1h");
  expect(sumTimeEstimates(["5m", "55m"])).toBe("1h");
  expect(sumTimeEstimates(["5m", "55m", "60m"])).toBe("2h");
  expect(sumTimeEstimates(["5m", "1h"])).toBe("1h");
  expect(sumTimeEstimates(["15m", "1h"])).toBe("1.5h");
  expect(sumTimeEstimates(["14m", "1h"])).toBe("1h");
});

test("returns 0m with no time estimates", ({ expect }) => {
  expect(sumTimeEstimates([])).toBe("0m");
});

test("return 0m with 0 sum of time estimates", ({ expect }) => {
  expect(sumTimeEstimates(["0m"])).toBe("0m");
});

test("ignores negative time estimates", ({ expect }) => {
  expect(sumTimeEstimates(["-0m", "-10m"])).toBe("0m");
});

test("works with undefined time estimates", ({ expect }) => {
  expect(sumTimeEstimates([undefined, "10m"])).toBe("10m");
});
