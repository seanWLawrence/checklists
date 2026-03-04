import { test } from "vitest";

import {
  getJournalAnalysisInput,
  getJournalEmbeddingInput,
  getJournalEmbeddingKey,
} from "./get-journal-embedding-input.lib";

test("getJournalEmbeddingInput delegates to normalization and returns empty string for non-string content", ({
  expect,
}) => {
  expect(
    getJournalEmbeddingInput({
      content: "",
    } as never),
  ).toBe("");
});

test("getJournalEmbeddingKey is stable by journal id", ({ expect }) => {
  expect(
    getJournalEmbeddingKey({
      id: "11111111-1111-1111-1111-111111111111",
    } as never),
  ).toBe("journalEmbedding#11111111-1111-1111-1111-111111111111");
});

test("getJournalAnalysisInput excludes the Dreams section", ({ expect }) => {
  expect(
    getJournalAnalysisInput({
      content: [
        "## Dreams",
        "Flying over a city",
        "",
        "## Highlights",
        "Had a good lunch",
        "",
        "## Plans",
        "Finish the report",
      ].join("\n"),
    }),
  ).toBe(
    ["## Highlights", "Had a good lunch", "## Plans", "Finish the report"].join(
      "\n",
    ),
  );
});
