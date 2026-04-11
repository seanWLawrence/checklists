import { Left, Right } from "purify-ts/Either";
import {
  Codec,
  GetType,
  array,
  exactly,
  number,
  oneOf,
  optional,
  string,
} from "purify-ts/Codec";

const JournalAnalyticsRequestKind = oneOf([
  exactly("overview"),
  exactly("sentimentTimeline"),
  exactly("activityImpact"),
  exactly("helpfulActivities"),
  exactly("entryRows"),
]);

export const JournalAnalyticsEntryRowField = oneOf([
  exactly("date"),
  exactly("ratings"),
  exactly("activities"),
  exactly("sentiment"),
  exactly("dailySummary"),
]);

const JournalAnalyticsOverviewRequest = Codec.interface({
  kind: exactly("overview"),
});

const JournalAnalyticsSentimentTimelineRequest = Codec.interface({
  kind: exactly("sentimentTimeline"),
  granularity: optional(oneOf([exactly("day"), exactly("week")])),
});

const JournalAnalyticsActivityImpactRequest = Codec.interface({
  kind: exactly("activityImpact"),
  minSampleSize: optional(number),
});

const JournalAnalyticsHelpfulActivitiesRequest = Codec.interface({
  kind: exactly("helpfulActivities"),
  limit: optional(number),
});

const JournalAnalyticsEntryRowsRequest = Codec.interface({
  kind: exactly("entryRows"),
  limit: optional(number),
  fields: array(JournalAnalyticsEntryRowField),
});

export const JournalAnalyticsRequest = oneOf([
  JournalAnalyticsOverviewRequest,
  JournalAnalyticsSentimentTimelineRequest,
  JournalAnalyticsActivityImpactRequest,
  JournalAnalyticsHelpfulActivitiesRequest,
  JournalAnalyticsEntryRowsRequest,
]);

export type JournalAnalyticsRequest = GetType<typeof JournalAnalyticsRequest>;

export const JournalAnalyticsRequestList = array(JournalAnalyticsRequest);
export type JournalAnalyticsRequestList = GetType<
  typeof JournalAnalyticsRequestList
>;

const NumberRecord = Codec.custom<Record<string, number>>({
  decode: (input) => {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      return Left("Expected number record");
    }

    const entries = Object.entries(input);

    if (!entries.every(([, value]) => typeof value === "number")) {
      return Left("Expected number record");
    }

    return Right(Object.fromEntries(entries));
  },
  encode: (input) => input,
});

export const JournalAnalyticsOverview = Codec.interface({
  totalEntries: number,
  analyzedCount: number,
  averageSentimentValence: optional(number),
  sentimentLabelCounts: NumberRecord,
  sentimentValenceBucketCounts: NumberRecord,
  topActivities: array(
    Codec.interface({
      key: string,
      label: string,
      count: number,
      percentOfEntries: number,
    }),
  ),
  helpfulActivities: array(
    Codec.interface({
      key: string,
      label: string,
      count: number,
      score: number,
      moodDelta: number,
      energyDelta: number,
      productivityDelta: number,
    }),
  ),
  notableMetrics: Codec.interface({
    averageMood: optional(number),
    averageEnergy: optional(number),
    averageProductivity: optional(number),
  }),
});

export type JournalAnalyticsOverview = GetType<typeof JournalAnalyticsOverview>;

export const JournalAnalyticsSentimentTimelinePoint = Codec.interface({
  date: string,
  valence: number,
  valenceAvg7: optional(number),
});
export type JournalAnalyticsSentimentTimelinePoint = GetType<
  typeof JournalAnalyticsSentimentTimelinePoint
>;

export const JournalAnalyticsActivityImpactRow = Codec.interface({
  key: string,
  label: string,
  count: number,
  percentOfEntries: number,
  averageMood: optional(number),
  averageEnergy: optional(number),
  averageProductivity: optional(number),
  moodDelta: optional(number),
  energyDelta: optional(number),
  productivityDelta: optional(number),
});
export type JournalAnalyticsActivityImpactRow = GetType<
  typeof JournalAnalyticsActivityImpactRow
>;

export const JournalAnalyticsHelpfulActivityRow = Codec.interface({
  key: string,
  label: string,
  count: number,
  score: number,
  moodDelta: number,
  energyDelta: number,
  productivityDelta: number,
});
export type JournalAnalyticsHelpfulActivityRow = GetType<
  typeof JournalAnalyticsHelpfulActivityRow
>;

export const JournalAnalyticsEntryRow = Codec.custom<Record<string, unknown>>({
  decode: (input) =>
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? Right(input as Record<string, unknown>)
      : Left("Expected entry row object"),
  encode: (input) => input,
});
export type JournalAnalyticsEntryRow = GetType<typeof JournalAnalyticsEntryRow>;

export const JournalAnalyticsQueryResultMeta = Codec.interface({
  since: string,
  generatedAt: string,
  version: number,
  requestedKinds: array(JournalAnalyticsRequestKind),
});

export const JournalAnalyticsQueryResult = Codec.interface({
  meta: JournalAnalyticsQueryResultMeta,
  results: Codec.interface({
    overview: optional(JournalAnalyticsOverview),
    sentimentTimeline: optional(array(JournalAnalyticsSentimentTimelinePoint)),
    activityImpact: optional(array(JournalAnalyticsActivityImpactRow)),
    helpfulActivities: optional(array(JournalAnalyticsHelpfulActivityRow)),
    entryRows: optional(array(JournalAnalyticsEntryRow)),
  }),
});

export type JournalAnalyticsQueryResult = GetType<
  typeof JournalAnalyticsQueryResult
>;
