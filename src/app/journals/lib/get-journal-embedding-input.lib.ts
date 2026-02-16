import { Journal } from "../journal.types";

export const normalizeJournalContent = (content: string): string => {
  const rows = content
    .split("\n")
    .map((row) => row.trim())
    .filter((row) => row.length > 0 && !row.startsWith("## "));

  return rows.join("\n").trim();
};

export const getJournalEmbeddingInput = (journal: Journal): string => {
  if (typeof journal.content !== "string") {
    return "";
  }

  return normalizeJournalContent(journal.content);
};

export const getJournalEmbeddingKey = (journal: Pick<Journal, "id">): string =>
  `journalEmbedding#${journal.id}`;
