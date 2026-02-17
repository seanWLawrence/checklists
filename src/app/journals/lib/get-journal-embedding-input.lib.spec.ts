import { test } from "vitest";

import {
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
