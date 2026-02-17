import "server-only";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import { JournalAnalysis, JournalHabits, SentimentLabel } from "../journal.types";
import { logger } from "@/lib/logger";
import { normalizeJournalContent } from "./get-journal-embedding-input.lib";

const MODEL = process.env.OPENAI_JOURNAL_ANALYSIS_MODEL ?? "gpt-4o-mini";
const ANALYSIS_VERSION = 1;
const MIN_JOURNAL_ANALYSIS_CHARS = Number(
  process.env.MIN_JOURNAL_ANALYSIS_CHARS ?? 40,
);

const emptyAnalysis = ({
  habits,
  now,
}: {
  habits: JournalHabits;
  now: string;
}): JournalAnalysis => ({
  dailySummary: undefined,
  sentiment: undefined,
  habits,
  analysisUpdatedAt: now,
  analysisVersion: ANALYSIS_VERSION,
});

const extractJson = (text: string): string => {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("Could not extract JSON object from model response");
};

export const getJournalAiAnalysis = async ({
  content,
  habits,
}: {
  content: string;
  habits: JournalHabits;
}): Promise<JournalAnalysis> => {
  const now = new Date().toISOString();
  const normalizedContent = normalizeJournalContent(content);
  const minChars = Number.isFinite(MIN_JOURNAL_ANALYSIS_CHARS)
    ? Math.max(0, Math.floor(MIN_JOURNAL_ANALYSIS_CHARS))
    : 40;

  if (!normalizedContent || normalizedContent.length < minChars) {
    return emptyAnalysis({ habits, now });
  }

  try {
    const response = await generateText({
      model: openai(MODEL),
      temperature: 0.2,
      system:
        "You analyze personal journal entries. Return only strict JSON with no markdown and no extra keys.",
      prompt:
        "Analyze this journal entry and return this exact JSON shape: " +
        '{ "dailySummary": string, "sentiment": { "valence": number between -1 and 1, "label": "negative"|"mixed"|"neutral"|"positive", "confidence": number between 0 and 1 } }. ' +
        "Rules: dailySummary must be 1-3 concise sentences. Sentiment must be grounded in the text.\n\nJournal entry:\n" +
        normalizedContent,
    });

    const parsed = JSON.parse(extractJson(response.text));

    const decoded = JournalAnalysis.decode({
      dailySummary: parsed?.dailySummary,
      sentiment:
        typeof parsed?.sentiment === "object" && parsed?.sentiment
          ? {
              valence: Number(parsed.sentiment.valence),
              label: parsed.sentiment.label as SentimentLabel,
              confidence:
                parsed.sentiment.confidence == null
                  ? undefined
                  : Number(parsed.sentiment.confidence),
            }
          : undefined,
      habits,
      analysisUpdatedAt: now,
      analysisVersion: ANALYSIS_VERSION,
    });

    if (decoded.isRight()) {
      return decoded.extract();
    }

    logger.warn("Journal AI analysis failed codec validation", decoded.extract());
    return emptyAnalysis({ habits, now });
  } catch (error) {
    logger.warn("Failed to generate journal AI analysis", error);
    return emptyAnalysis({ habits, now });
  }
};
