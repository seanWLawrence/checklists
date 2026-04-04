import { Journal, SentimentLabel } from "../journal.types";
import { getTrackedActivities } from "./journal-check-in";
import {
  getSentimentValenceInfo,
  SentimentValenceBucket,
} from "./get-sentiment-valence-info.lib";

type RatingKey = "mood" | "energy" | "productivity";

type ActivityImpact = {
  key: string;
  label: string;
  groupLabel: string;
  count: number;
  withoutCount: number;
  percentOfEntries: number;
  averageMood: number | undefined;
  averageEnergy: number | undefined;
  averageProductivity: number | undefined;
  averageMoodWithoutActivity: number | undefined;
  averageEnergyWithoutActivity: number | undefined;
  averageProductivityWithoutActivity: number | undefined;
  moodDelta: number | undefined;
  energyDelta: number | undefined;
  productivityDelta: number | undefined;
};

type HelpfulActivity = {
  key: string;
  label: string;
  groupLabel: string;
  count: number;
  percentOfEntries: number;
  score: number;
  moodDelta: number;
  energyDelta: number;
  productivityDelta: number;
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
  topActivities: Array<{
    key: string;
    label: string;
    groupLabel: string;
    count: number;
    percentOfEntries: number;
  }>;
  activityImpact: ActivityImpact[];
  minSampleSizeForRanking: number;
  helpfulActivities: HelpfulActivity[];
};

const round = (value: number, precision = 2): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const averageRating = (journals: Journal[], key: RatingKey): number | undefined => {
  let count = 0;
  let total = 0;

  for (const journal of journals) {
    const value = journal.checkIn.ratings?.[key];

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
  withActivity: number | undefined,
  withoutActivity: number | undefined,
): number | undefined => {
  if (typeof withActivity !== "number" || typeof withoutActivity !== "number") {
    return undefined;
  }

  return round(withActivity - withoutActivity);
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

  const activityCounts = new Map<
    string,
    { key: string; label: string; groupLabel: string; count: number }
  >();
  const sentimentRows: Array<{ dateMilli: number; valence: number }> = [];

  for (const journal of journals) {
    if (journal.analysis?.sentiment) {
      analyzedCount += 1;
      sentimentValenceTotal += journal.analysis.sentiment.valence;
      sentimentLabelCounts[journal.analysis.sentiment.label] += 1;
      const valenceInfo = getSentimentValenceInfo(
        journal.analysis.sentiment.valence,
      );
      sentimentValenceBucketCounts[valenceInfo.bucket] += 1;
      sentimentRows.push({
        dateMilli: new Date(journal.createdAtLocal).getTime(),
        valence: journal.analysis.sentiment.valence,
      });
    }

    for (const activity of getTrackedActivities({ checkIn: journal.checkIn })) {
      const existing = activityCounts.get(activity.key);

      if (existing) {
        existing.count += 1;
      } else {
        activityCounts.set(activity.key, {
          key: activity.key,
          label: activity.label,
          groupLabel: activity.groupLabel,
          count: 1,
        });
      }
    }
  }

  const totalEntries = journals.length;

  const topActivities = Array.from(activityCounts.values())
    .map((activity) => ({
      ...activity,
      percentOfEntries:
        totalEntries > 0 ? round((activity.count / totalEntries) * 100, 1) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const sentimentTimeline = [...sentimentRows]
    .sort((a, b) => a.dateMilli - b.dateMilli)
    .map((row, index, sorted) => ({
      ...row,
      valenceAvg7: sentimentRollingAverage(sorted, index),
    }));

  const activityImpact = Array.from(activityCounts.values())
    .map((activity) => {
      const withActivity = journals.filter((journal) =>
        getTrackedActivities({ checkIn: journal.checkIn }).some(
          (tracked) => tracked.key === activity.key,
        ),
      );
      const withoutActivity = journals.filter(
        (journal) =>
          !getTrackedActivities({ checkIn: journal.checkIn }).some(
            (tracked) => tracked.key === activity.key,
          ),
      );
      const count = withActivity.length;

      const averageMood = averageRating(withActivity, "mood");
      const averageEnergy = averageRating(withActivity, "energy");
      const averageProductivity = averageRating(withActivity, "productivity");

      const averageMoodWithoutActivity = averageRating(withoutActivity, "mood");
      const averageEnergyWithoutActivity = averageRating(
        withoutActivity,
        "energy",
      );
      const averageProductivityWithoutActivity = averageRating(
        withoutActivity,
        "productivity",
      );

      return {
        key: activity.key,
        label: activity.label,
        groupLabel: activity.groupLabel,
        count,
        withoutCount: withoutActivity.length,
        percentOfEntries:
          totalEntries > 0 ? round((count / totalEntries) * 100, 1) : 0,
        averageMood,
        averageEnergy,
        averageProductivity,
        averageMoodWithoutActivity,
        averageEnergyWithoutActivity,
        averageProductivityWithoutActivity,
        moodDelta: maybeDelta(averageMood, averageMoodWithoutActivity),
        energyDelta: maybeDelta(averageEnergy, averageEnergyWithoutActivity),
        productivityDelta: maybeDelta(
          averageProductivity,
          averageProductivityWithoutActivity,
        ),
      };
    })
    .filter((activity) => activity.count > 0)
    .sort((a, b) => b.count - a.count);

  const minSampleSizeForRanking = getMinSampleSizeForRanking(totalEntries);

  const helpfulActivities = activityImpact
    .filter(
      (activity) =>
        activity.count >= minSampleSizeForRanking &&
        activity.withoutCount >= minSampleSizeForRanking,
    )
    .map((activity) => {
      const deltaStrength =
        safePositive(activity.moodDelta) +
        safePositive(activity.energyDelta) +
        safePositive(activity.productivityDelta);

      const frequencyWeight =
        totalEntries > 0 ? Math.sqrt(activity.count / totalEntries) : 0;
      const score = round(deltaStrength * frequencyWeight, 3);

      return {
        key: activity.key,
        label: activity.label,
        groupLabel: activity.groupLabel,
        count: activity.count,
        percentOfEntries: activity.percentOfEntries,
        score,
        moodDelta: activity.moodDelta ?? 0,
        energyDelta: activity.energyDelta ?? 0,
        productivityDelta: activity.productivityDelta ?? 0,
      };
    })
    .filter((activity) => activity.score > 0)
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
    topActivities,
    activityImpact,
    minSampleSizeForRanking,
    helpfulActivities,
  };
};
