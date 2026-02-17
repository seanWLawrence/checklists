import { Journal, SentimentLabel } from "../journal.types";
import { JOURNAL_HABIT_FIELDS } from "./journal-habits";
import {
  getSentimentValenceInfo,
  SentimentValenceBucket,
} from "./get-sentiment-valence-info.lib";

type LevelKey = "moodLevel" | "energyLevel" | "healthLevel";

type HabitImpact = {
  key: string;
  label: string;
  count: number;
  withoutCount: number;
  percentOfEntries: number;
  averageMood: number | undefined;
  averageEnergy: number | undefined;
  averageHealth: number | undefined;
  averageMoodWithoutHabit: number | undefined;
  averageEnergyWithoutHabit: number | undefined;
  averageHealthWithoutHabit: number | undefined;
  moodDelta: number | undefined;
  energyDelta: number | undefined;
  healthDelta: number | undefined;
};

type HelpfulHabit = {
  key: string;
  label: string;
  count: number;
  percentOfEntries: number;
  score: number;
  moodDelta: number;
  energyDelta: number;
  healthDelta: number;
};

export type JournalAiAnalytics = {
  totalEntries: number;
  analyzedCount: number;
  averageSentimentValence: number | undefined;
  sentimentLabelCounts: Record<SentimentLabel, number>;
  sentimentValenceBucketCounts: Record<SentimentValenceBucket, number>;
  sentimentTimeline: Array<{
    dateMilli: number;
    valence: number;
    valenceAvg7: number | undefined;
  }>;
  topHabits: Array<{
    key: string;
    label: string;
    count: number;
    percentOfEntries: number;
  }>;
  habitImpact: HabitImpact[];
  minSampleSizeForRanking: number;
  helpfulHabits: HelpfulHabit[];
};

const round = (value: number, precision = 2): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const averageLevel = (journals: Journal[], key: LevelKey): number | undefined => {
  let count = 0;
  let total = 0;

  for (const journal of journals) {
    const value = journal[key];

    if (typeof value === "number") {
      total += value;
      count += 1;
    }
  }

  if (count === 0) {
    return undefined;
  }

  return round(total / count);
};

const sentimentRollingAverage = (
  data: Array<{ dateMilli: number; valence: number }>,
  index: number,
  windowSize = 7,
): number | undefined => {
  const start = Math.max(0, index - windowSize + 1);
  const values = data.slice(start, index + 1).map((row) => row.valence);

  if (values.length === 0) {
    return undefined;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return round(total / values.length);
};

const maybeDelta = (
  withHabit: number | undefined,
  withoutHabit: number | undefined,
): number | undefined => {
  if (typeof withHabit !== "number" || typeof withoutHabit !== "number") {
    return undefined;
  }

  return round(withHabit - withoutHabit);
};

const safePositive = (value: number | undefined): number =>
  typeof value === "number" && value > 0 ? value : 0;

const getMinSampleSizeForRanking = (totalEntries: number): number => {
  if (totalEntries <= 0) {
    return 0;
  }

  return Math.max(5, Math.ceil(totalEntries * 0.08));
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

  const sentimentValenceBucketCounts: Record<SentimentValenceBucket, number> = {
    veryPositive: 0,
    positive: 0,
    mixed: 0,
    negative: 0,
    veryNegative: 0,
  };

  let analyzedCount = 0;
  let sentimentValenceTotal = 0;

  const habitCounts = Object.fromEntries(
    JOURNAL_HABIT_FIELDS.map(({ key }) => [key, 0]),
  ) as Record<string, number>;

  const sentimentRows: Array<{ dateMilli: number; valence: number }> = [];

  for (const journal of journals) {
    if (journal.sentiment) {
      analyzedCount += 1;
      sentimentValenceTotal += journal.sentiment.valence;
      sentimentLabelCounts[journal.sentiment.label] += 1;
      const valenceInfo = getSentimentValenceInfo(journal.sentiment.valence);
      sentimentValenceBucketCounts[valenceInfo.bucket] += 1;
      sentimentRows.push({
        dateMilli: new Date(journal.createdAtLocal).getTime(),
        valence: journal.sentiment.valence,
      });
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

  const sentimentTimeline = [...sentimentRows]
    .sort((a, b) => a.dateMilli - b.dateMilli)
    .map((row, index, sorted) => ({
      ...row,
      valenceAvg7: sentimentRollingAverage(sorted, index),
    }));

  const habitImpact = JOURNAL_HABIT_FIELDS.map(({ key, label }) => {
    const withHabit = journals.filter((journal) => journal.habits?.[key]);
    const withoutHabit = journals.filter((journal) => !journal.habits?.[key]);
    const count = withHabit.length;

    const averageMood = averageLevel(withHabit, "moodLevel");
    const averageEnergy = averageLevel(withHabit, "energyLevel");
    const averageHealth = averageLevel(withHabit, "healthLevel");

    const averageMoodWithoutHabit = averageLevel(withoutHabit, "moodLevel");
    const averageEnergyWithoutHabit = averageLevel(withoutHabit, "energyLevel");
    const averageHealthWithoutHabit = averageLevel(withoutHabit, "healthLevel");

    return {
      key,
      label,
      count,
      withoutCount: withoutHabit.length,
      percentOfEntries: totalEntries > 0 ? round((count / totalEntries) * 100, 1) : 0,
      averageMood,
      averageEnergy,
      averageHealth,
      averageMoodWithoutHabit,
      averageEnergyWithoutHabit,
      averageHealthWithoutHabit,
      moodDelta: maybeDelta(averageMood, averageMoodWithoutHabit),
      energyDelta: maybeDelta(averageEnergy, averageEnergyWithoutHabit),
      healthDelta: maybeDelta(averageHealth, averageHealthWithoutHabit),
    };
  })
    .filter((habit) => habit.count > 0)
    .sort((a, b) => b.count - a.count);

  const minSampleSizeForRanking = getMinSampleSizeForRanking(totalEntries);

  const helpfulHabits = habitImpact
    .filter(
      (habit) =>
        habit.count >= minSampleSizeForRanking &&
        habit.withoutCount >= minSampleSizeForRanking,
    )
    .map((habit) => {
      const deltaStrength =
        safePositive(habit.moodDelta) +
        safePositive(habit.energyDelta) +
        safePositive(habit.healthDelta);

      const frequencyWeight =
        totalEntries > 0 ? Math.sqrt(habit.count / totalEntries) : 0;
      const score = round(deltaStrength * frequencyWeight, 3);

      return {
        key: habit.key,
        label: habit.label,
        count: habit.count,
        percentOfEntries: habit.percentOfEntries,
        score,
        moodDelta: habit.moodDelta ?? 0,
        energyDelta: habit.energyDelta ?? 0,
        healthDelta: habit.healthDelta ?? 0,
      };
    })
    .filter((habit) => habit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    totalEntries,
    analyzedCount,
    averageSentimentValence:
      analyzedCount > 0 ? round(sentimentValenceTotal / analyzedCount) : undefined,
    sentimentLabelCounts,
    sentimentValenceBucketCounts,
    sentimentTimeline,
    topHabits,
    habitImpact,
    minSampleSizeForRanking,
    helpfulHabits,
  };
};
