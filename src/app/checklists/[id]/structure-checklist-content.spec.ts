import { test } from "vitest";
import {
  structureChecklistContent,
  structureChecklistContentRow,
} from "./structure-checklist-content";

const withTimeNoteCompleted = "--hello world 5m (some note)";
const withTimeNoteIncomplete = "hello world (some note) 5m";
const withNoteCompleted = "--hello world (some note)";
const withNoteIncomplete = "hello world (some note)";
const withTimeNoNoteCompleted = "--hello world 5m";
const withTimeNoNoteIncomplete = "hello world 5m";
const noTimeNoNoteCompleted = "--hello world";
const noTimeNoNoteIncomplete = "hello world";
const stress1 = "    hello world    ";
const stress2 = "    hello world    (    some note    )";
const stress3 = "hello world       (    some note    ) 10m      ";
const stress4 = "--        hello world      (    some note    ) 10m     ";

const withTimeNoteCompletedResult = {
  name: "hello world",
  completed: true,
  note: "some note",
  timeEstimate: "5m",
};

const withTimeNoteIncompleteResult = {
  name: "hello world",
  completed: false,
  note: "some note",
  timeEstimate: "5m",
};

const withNoteCompletedResult = {
  name: "hello world",
  completed: true,
  note: "some note",
  timeEstimate: undefined,
};

const withNoteIncompleteResult = {
  name: "hello world",
  completed: false,
  note: "some note",
  timeEstimate: undefined,
};

const withTimeNoNoteCompletedResult = {
  name: "hello world",
  completed: true,
  note: undefined,
  timeEstimate: "5m",
};

const withTimeNoNoteIncompleteResult = {
  name: "hello world",
  completed: false,
  note: undefined,
  timeEstimate: "5m",
};

const noTimeNoNoteCompletedResult = {
  name: "hello world",
  completed: true,
  note: undefined,
  timeEstimate: undefined,
};

const noTimeNoNoteIncompleteResult = {
  name: "hello world",
  completed: false,
  note: undefined,
  timeEstimate: undefined,
};

const stress1Result = {
  name: "hello world",
  completed: false,
  note: undefined,
  timeEstimate: undefined,
};

const stress2Result = {
  name: "hello world",
  completed: false,
  note: "some note",
  timeEstimate: undefined,
};

const stress3Result = {
  name: "hello world",
  completed: false,
  note: "some note",
  timeEstimate: "10m",
};

const stress4Result = {
  name: "hello world",
  completed: true,
  note: "some note",
  timeEstimate: "10m",
};

test("structureChecklistContentRow", ({ expect }) => {
  expect(
    structureChecklistContentRow(withTimeNoteCompleted).extract(),
  ).toMatchObject(withTimeNoteCompletedResult);

  expect(
    structureChecklistContentRow(withTimeNoteIncomplete).extract(),
  ).toMatchObject(withTimeNoteIncompleteResult);

  expect(
    structureChecklistContentRow(withNoteCompleted).extract(),
  ).toMatchObject(withNoteCompletedResult);

  expect(
    structureChecklistContentRow(withNoteIncomplete).extract(),
  ).toMatchObject(withNoteIncompleteResult);

  expect(
    structureChecklistContentRow(withTimeNoNoteCompleted).extract(),
  ).toMatchObject(withTimeNoNoteCompletedResult);

  expect(
    structureChecklistContentRow(withTimeNoNoteIncomplete).extract(),
  ).toMatchObject(withTimeNoNoteIncompleteResult);

  expect(
    structureChecklistContentRow(noTimeNoNoteCompleted).extract(),
  ).toMatchObject(noTimeNoNoteCompletedResult);

  expect(
    structureChecklistContentRow(noTimeNoNoteIncomplete).extract(),
  ).toMatchObject(noTimeNoNoteIncompleteResult);

  expect(structureChecklistContentRow(stress1).extract()).toMatchObject(
    stress1Result,
  );

  expect(structureChecklistContentRow(stress2).extract()).toMatchObject(
    stress2Result,
  );

  expect(structureChecklistContentRow(stress3).extract()).toMatchObject(
    stress3Result,
  );

  expect(structureChecklistContentRow(stress4).extract()).toMatchObject(
    stress4Result,
  );
});

test("structureChecklistContent", ({ expect }) => {
  const sectionA = "section A";
  const sectionB = "section B";

  const content = "".concat(
    sectionA,
    "\n",
    withTimeNoteCompleted,
    "\n",
    withTimeNoteIncomplete,
    "\n",
    withNoteCompleted,
    "\n",
    withNoteIncomplete,
    "\n",
    withTimeNoNoteCompleted,
    "\n",
    withTimeNoNoteIncomplete,
    "\n",
    noTimeNoNoteCompleted,
    "\n",
    noTimeNoNoteIncomplete,

    "\n",
    "\n",

    sectionB,
    "\n",
    stress1,
    "\n",
    stress2,
    "\n",
    stress3,
    "\n",
    stress4,
    "\n",
  );

  expect(structureChecklistContent(content)).toMatchObject({
    sections: [
      {
        name: sectionA,
        items: [
          withTimeNoteCompletedResult,
          withTimeNoteIncompleteResult,
          withNoteCompletedResult,
          withNoteIncompleteResult,
          withTimeNoNoteCompletedResult,
          withTimeNoNoteIncompleteResult,
          noTimeNoNoteCompletedResult,
          noTimeNoNoteIncompleteResult,
        ],
      },
      {
        name: sectionB,
        items: [stress1Result, stress2Result, stress3Result, stress4Result],
      },
    ],
  });
});
