import "@nobush/server-only";

import { EitherAsync } from "purify-ts";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getAllItems } from "@/lib/redis/get-all-items";
import { scan } from "@/lib/redis/scan";
import { logger } from "@/lib/logger";
import { Journal } from "../journal.types";
import { parseSinceRange } from "./parse-since-range.lib";
import { getAllJournalsScanKeys } from "../model/get-all-created-at-locals.model";
import { getJournalAiAnalytics } from "./get-journal-ai-analytics.lib";
import { buildJournalAnalyticsOverview } from "./build-journal-analytics-overview.lib";
import {
  JournalAnalyticsQueryResult,
  JournalAnalyticsRequestList,
  type JournalAnalyticsEntryRow,
} from "./journal-analytics-query.types";
import { getTrackedActivities } from "./journal-check-in";

const QUERY_RESULT_VERSION = 1;
const DEFAULT_HELPFUL_ACTIVITIES_LIMIT = 5;
const MAX_HELPFUL_ACTIVITIES_LIMIT = 10;
const DEFAULT_ENTRY_ROWS_LIMIT = 20;
const MAX_ENTRY_ROWS_LIMIT = 50;

const clampInteger = ({
  value,
  min,
  max,
  fallback,
}: {
  value: number | undefined;
  min: number;
  max: number;
  fallback: number;
}): number => {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.floor(value as number)));
};

const getSentimentTimelineDate = ({ dateMilli }: { dateMilli: number }): string =>
  new Date(dateMilli).toISOString().slice(0, 10);

const getEntryRow = ({
  journal,
  fields,
}: {
  journal: Journal;
  fields: Array<"date" | "ratings" | "activities" | "sentiment" | "dailySummary">;
}): JournalAnalyticsEntryRow => {
  const row: JournalAnalyticsEntryRow = {};

  for (const field of fields) {
    if (field === "date") {
      row.date = journal.createdAtLocal;
    }

    if (field === "ratings") {
      row.ratings = journal.checkIn.ratings ?? null;
    }

    if (field === "activities") {
      row.activities = getTrackedActivities({ checkIn: journal.checkIn }).map(
        (activity) => `${activity.groupLabel} / ${activity.label}`,
      );
    }

    if (field === "sentiment") {
      row.sentiment = journal.analysis?.sentiment
        ? {
            label: journal.analysis.sentiment.label,
            valence: journal.analysis.sentiment.valence,
            confidence: journal.analysis.sentiment.confidence,
          }
        : null;
    }

    if (field === "dailySummary") {
      row.dailySummary = journal.analysis?.dailySummary ?? null;
    }
  }

  return row;
};

export const getJournalAnalyticsQueryResult = ({
  since: unsafeSince,
  requests: unsafeRequests,
}: {
  since: string;
  requests: unknown;
}): EitherAsync<unknown, JournalAnalyticsQueryResult> => {
  return EitherAsync(async ({ fromPromise, liftEither, throwE }) => {
    const { since, from, to } = await liftEither(parseSinceRange(unsafeSince));
    const requests = await liftEither(JournalAnalyticsRequestList.decode(unsafeRequests));
    const user = await fromPromise(validateUserLoggedIn({}));

    const validatedKeys = await fromPromise(
      EitherAsync.all(
        getAllJournalsScanKeys({ user }).map((key) => scan({ key })),
      ).map((groups) => [...new Set(groups.flat())]),
    );

    const journals = await fromPromise(
      getAllItems({ keys: validatedKeys, decoder: Journal }),
    );

    const filteredJournals = journals.filter((journal) => {
      const createdAt = journal.createdAtLocal;
      return from <= createdAt && createdAt <= to;
    });

    const analytics = getJournalAiAnalytics(filteredJournals);
    const result: JournalAnalyticsQueryResult = {
      meta: {
        since,
        generatedAt: new Date().toISOString(),
        version: QUERY_RESULT_VERSION,
        requestedKinds: [...new Set(requests.map((request) => request.kind))],
      },
      results: {
        overview: undefined,
        sentimentTimeline: undefined,
        activityImpact: undefined,
        helpfulActivities: undefined,
        entryRows: undefined,
      },
    };

    for (const request of requests) {
      if (request.kind === "overview") {
        result.results.overview = buildJournalAnalyticsOverview({
          journals: filteredJournals,
          analytics,
        });
      }

      if (request.kind === "sentimentTimeline") {
        result.results.sentimentTimeline = analytics.sentimentTimeline.map((row) => ({
          date: getSentimentTimelineDate({ dateMilli: row.dateMilli }),
          valence: row.valence,
          valenceAvg7: row.valenceAvg7,
        }));
      }

      if (request.kind === "activityImpact") {
        const minSampleSize = clampInteger({
          value: request.minSampleSize,
          min: 1,
          max: 365,
          fallback: 1,
        });

        result.results.activityImpact = analytics.activityImpact
          .filter(
            (activity) =>
              activity.count >= minSampleSize &&
              activity.withoutCount >= minSampleSize,
          )
          .map((activity) => ({
            key: activity.key,
            label: `${activity.groupLabel} / ${activity.label}`,
            count: activity.count,
            percentOfEntries: activity.percentOfEntries,
            averageMood: activity.averageMood,
            averageEnergy: activity.averageEnergy,
            averageProductivity: activity.averageProductivity,
            moodDelta: activity.moodDelta,
            energyDelta: activity.energyDelta,
            productivityDelta: activity.productivityDelta,
          }));
      }

      if (request.kind === "helpfulActivities") {
        const limit = clampInteger({
          value: request.limit,
          min: 1,
          max: MAX_HELPFUL_ACTIVITIES_LIMIT,
          fallback: DEFAULT_HELPFUL_ACTIVITIES_LIMIT,
        });

        result.results.helpfulActivities = analytics.helpfulActivities
          .slice(0, limit)
          .map((activity) => ({
            key: activity.key,
            label: `${activity.groupLabel} / ${activity.label}`,
            count: activity.count,
            score: activity.score,
            moodDelta: activity.moodDelta,
            energyDelta: activity.energyDelta,
            productivityDelta: activity.productivityDelta,
          }));
      }

      if (request.kind === "entryRows") {
        const limit = clampInteger({
          value: request.limit,
          min: 1,
          max: MAX_ENTRY_ROWS_LIMIT,
          fallback: DEFAULT_ENTRY_ROWS_LIMIT,
        });

        result.results.entryRows = filteredJournals
          .slice()
          .sort((a, b) => b.createdAtLocal.localeCompare(a.createdAtLocal))
          .slice(0, limit)
          .map((journal) => getEntryRow({ journal, fields: request.fields }));
      }
    }

    const decoded = JournalAnalyticsQueryResult.decode(result);

    if (decoded.isLeft()) {
      return throwE(decoded.extract());
    }

    return decoded.unsafeCoerce();
  })
    .ifRight(() => {
      logger.info("Successfully loaded journal analytics query result");
    })
    .ifLeft((error) => {
      logger.error("Failed to load journal analytics query result");
      logger.error(error);
    });
};
