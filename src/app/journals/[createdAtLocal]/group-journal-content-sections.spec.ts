import { test } from "vitest";
import { groupJournalContentSections } from "./group-journal-content-sections";

test("removes ## headings without and children", ({ expect }) => {
  const content = `
## Hello
## World
`;

  expect(groupJournalContentSections(content).extract()).toEqual([]);

  const content2 = `
## Hello
## World
Children
`;

  expect(groupJournalContentSections(content2).extract()).toEqual([
    { heading: "World", children: ["Children"] },
  ]);
});

test("groups headings and children", ({ expect }) => {
  const content2 = `
## One
Child1
Child2

## Two
Child3
`;

  expect(groupJournalContentSections(content2).extract()).toEqual([
    { heading: "One", children: ["Child1", "Child2"] },
    { heading: "Two", children: ["Child3"] },
  ]);
});

test("works with empty string", ({ expect }) => {
  const content = "";

  expect(groupJournalContentSections(content).extract()).toEqual([]);
});
