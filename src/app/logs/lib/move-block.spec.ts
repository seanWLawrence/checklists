import { test } from "vitest";
import { moveBlock } from "./move-block";

test("moveBlock moves a block upward", ({ expect }) => {
  const blocks = [
    { variant: "shortMarkdown" as const, value: "first" },
    { variant: "shortMarkdown" as const, value: "second" },
    { variant: "shortMarkdown" as const, value: "third" },
  ];

  const moved = moveBlock({ blocks, fromIndex: 2, toIndex: 1 });

  expect(moved).toEqual([
    "first",
    "third",
    "second",
  ].map((value) => ({ variant: "shortMarkdown", value })));
});

test("moveBlock moves a block downward", ({ expect }) => {
  const blocks = [
    { variant: "shortMarkdown" as const, value: "first" },
    { variant: "shortMarkdown" as const, value: "second" },
    { variant: "shortMarkdown" as const, value: "third" },
  ];

  const moved = moveBlock({ blocks, fromIndex: 0, toIndex: 1 });

  expect(moved).toEqual([
    "second",
    "first",
    "third",
  ].map((value) => ({ variant: "shortMarkdown", value })));
});

test("moveBlock returns the original array for invalid positions", ({
  expect,
}) => {
  const blocks = [{ variant: "shortMarkdown" as const, value: "first" }];

  expect(moveBlock({ blocks, fromIndex: -1, toIndex: 0 })).toBe(blocks);
  expect(moveBlock({ blocks, fromIndex: 0, toIndex: 1 })).toBe(blocks);
  expect(moveBlock({ blocks, fromIndex: 0, toIndex: 0 })).toBe(blocks);
});
