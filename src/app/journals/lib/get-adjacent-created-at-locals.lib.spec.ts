import { test } from "vitest";
import { getAdjacentCreatedAtLocals } from "./get-adjacent-created-at-locals.lib";

test("returns previous and next for a middle journal", ({ expect }) => {
  const result = getAdjacentCreatedAtLocals({
    createdAtLocal: "2025-02-10",
    createdAtLocals: ["2025-02-01", "2025-02-28", "2025-02-10"],
  });

  expect(result).toEqual({
    previousCreatedAtLocal: "2025-02-01",
    nextCreatedAtLocal: "2025-02-28",
  });
});

test("returns only next for the first journal", ({ expect }) => {
  const result = getAdjacentCreatedAtLocals({
    createdAtLocal: "2024-12-31",
    createdAtLocals: ["2024-12-31", "2025-01-01"],
  });

  expect(result).toEqual({
    previousCreatedAtLocal: undefined,
    nextCreatedAtLocal: "2025-01-01",
  });
});

test("returns only previous for the last journal", ({ expect }) => {
  const result = getAdjacentCreatedAtLocals({
    createdAtLocal: "2025-01-01",
    createdAtLocals: ["2024-12-31", "2025-01-01"],
  });

  expect(result).toEqual({
    previousCreatedAtLocal: "2024-12-31",
    nextCreatedAtLocal: undefined,
  });
});

test("returns empty object when the journal is missing from the list", ({
  expect,
}) => {
  const result = getAdjacentCreatedAtLocals({
    createdAtLocal: "2025-02-10",
    createdAtLocals: ["2025-02-01", "2025-02-28"],
  });

  expect(result).toEqual({});
});
