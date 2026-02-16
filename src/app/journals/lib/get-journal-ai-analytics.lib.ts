import { Journal, SentimentLabel } from "../journal.types";
import { JOURNAL_HABIT_FIELDS } from "./journal-habits";

export type JournalAiAnalytics = {
  totalEntries: number;
  analyzedCount: number;
  averageSentimentValence: number | undefined;
  sentimentLabelCounts: Record<SentimentLabel, number>;
  topHabits: Array<{
    key: string;
    label: string;
    count: number;
    percentOfEntries: number;
  }>;
};

const round = (value: number, precision = 2): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export const getJournalAiAnalytics = (
  journals: Journal[],
): JournalAiAnalytics => {
  const sentimentLabelCounts: Record<SentimentLabel, number> = {
    negative: 0,
    mixed: 0,
    neutral: 0,
    positive: 0,
  };

  let analyzedCount = 0;
  let sentimentValenceTotal = 0;

  const habitCounts = Object.fromEntries(
    JOURNAL_HABIT_FIELDS.map(({ key }) => [key, 0]),
  ) as Record<string, number>;

  for (const journal of journals) {
    if (journal.sentiment) {
      analyzedCount += 1;
      sentimentValenceTotal += journal.sentiment.valence;
      sentimentLabelCounts[journal.sentiment.label] += 1;
    }

    for (const { key } of JOURNAL_HABIT_FIELDS) {
      if (journal.habits?.[key]) {
        habitCounts[key] = (habitCounts[key] ?? 0) + 1;
      }
    }
  }

  const totalEntries = journals.length;

  const topHabits = JOURNAL_HABIT_FIELDS.map(({ key, label }) => {
    const count = habitCounts[key] ?? 0;
    const percentOfEntries =
      totalEntries > 0 ? round((count / totalEntries) * 100, 1) : 0;

    return {
      key,
      label,
      count,
      percentOfEntries,
    };
  })
    .filter((habit) => habit.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalEntries,
    analyzedCount,
    averageSentimentValence:
      analyzedCount > 0 ? round(sentimentValenceTotal / analyzedCount) : undefined,
    sentimentLabelCounts,
    topHabits,
  };
};
