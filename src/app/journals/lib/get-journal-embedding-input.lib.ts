import { Journal } from "../journal.types";

export const normalizeJournalContent = (content: string): string => {
  const rows = content
    .split("\n")
    .map((row) => row.trim())
    .filter((row) => row.length > 0);

  return rows.join("\n").trim();
};

export const getJournalAnalysisInput = ({
  content,
}: {
  content: string;
}): string => {
  const filteredRows: string[] = [];
  let excludeCurrentSection = false;

  for (const row of content.split(/\r?\n/)) {
    const line = row.trim();
    if (line.length === 0) {
      continue;
    }

    if (line.startsWith("## ")) {
      const heading = line.slice(3).trim().toLowerCase();
      excludeCurrentSection = heading === "dreams";

      if (excludeCurrentSection) {
        continue;
      }
    }

    if (!excludeCurrentSection) {
      filteredRows.push(line);
    }
  }

  return filteredRows.join("\n").trim();
};

export const getJournalEmbeddingInput = (journal: Journal): string => {
  if (typeof journal.content !== "string") {
    return "";
  }

  return normalizeJournalContent(journal.content);
};

export const getJournalEmbeddingKey = (journal: Pick<Journal, "id">): string =>
  `journalEmbedding#${journal.id}`;
