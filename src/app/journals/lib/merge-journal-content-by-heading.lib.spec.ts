import { test } from "vitest";
import { mergeJournalContentByHeading } from "./merge-journal-content-by-heading.lib";

test("merges incoming lines into existing matching headings", ({ expect }) => {
  const current = [
    "## Dreams",
    "Old dream",
    "",
    "## Highlights",
    "Old highlight",
  ].join("\n");

  const incoming = [
    "## Dreams",
    "New dream",
    "",
    "## Highlights",
    "New highlight",
  ].join("\n");

  const merged = mergeJournalContentByHeading({ current, incoming });

  expect(merged).toBe(
    [
      "## Dreams",
      "Old dream",
      "New dream",
      "",
      "## Highlights",
      "Old highlight",
      "New highlight",
    ].join("\n"),
  );
});

test("keeps only one section when current content already has duplicate headings", ({
  expect,
}) => {
  const current = [
    "## Ideas",
    "Existing idea",
    "",
    "## Ideas",
    "Duplicate heading line",
  ].join("\n");

  const incoming = ["## Ideas", "Incoming idea"].join("\n");

  const merged = mergeJournalContentByHeading({ current, incoming });

  expect(merged).toBe(
    [
      "## Ideas",
      "Existing idea",
      "Duplicate heading line",
      "Incoming idea",
    ].join("\n"),
  );
});

test("falls back to plain append when incoming text has no headings", ({
  expect,
}) => {
  const current = ["## Other", "Existing line"].join("\n");
  const incoming = "No heading line";

  const merged = mergeJournalContentByHeading({ current, incoming });

  expect(merged).toBe(["## Other", "Existing line", "", "No heading line"].join("\n"));
});
