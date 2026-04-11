import { Journal } from "../journal.types";
import { JournalAiAnalytics } from "./get-journal-ai-analytics.lib";
import { JournalAnalyticsOverview } from "./journal-analytics-query.types";

const round = (value: number, precision = 2): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const averageRating = (
  journals: Journal[],
  key: "mood" | "energy" | "productivity",
): number | undefined => {
  let total = 0;
  let count = 0;

  for (const journal of journals) {
    const value = journal.checkIn.ratings?.[key];

    if (typeof value === "number") {
      total += value;
      count += 1;
    }
  }

  return count > 0 ? round(total / count) : undefined;
};

export const buildJournalAnalyticsOverview = ({
  journals,
  analytics,
}: {
  journals: Journal[];
  analytics: JournalAiAnalytics;
}): JournalAnalyticsOverview => ({
  totalEntries: analytics.totalEntries,
  analyzedCount: analytics.analyzedCount,
  averageSentimentValence: analytics.averageSentimentValence,
  sentimentLabelCounts: analytics.sentimentLabelCounts,
  sentimentValenceBucketCounts: analytics.sentimentValenceBucketCounts,
  topActivities: analytics.topActivities.map((activity) => ({
    key: activity.key,
    label: `${activity.groupLabel} / ${activity.label}`,
    count: activity.count,
    percentOfEntries: activity.percentOfEntries,
  })),
  helpfulActivities: analytics.helpfulActivities.map((activity) => ({
    key: activity.key,
    label: `${activity.groupLabel} / ${activity.label}`,
    count: activity.count,
    score: activity.score,
    moodDelta: activity.moodDelta,
    energyDelta: activity.energyDelta,
    productivityDelta: activity.productivityDelta,
  })),
  notableMetrics: {
    averageMood: averageRating(journals, "mood"),
    averageEnergy: averageRating(journals, "energy"),
    averageProductivity: averageRating(journals, "productivity"),
  },
});
