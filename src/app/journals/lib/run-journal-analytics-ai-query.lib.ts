import "@nobush/server-only";

import { EitherAsync } from "purify-ts";

import { getJournalAnalyticsPresetPlan } from "./get-journal-analytics-preset-plan.lib";
import { getJournalAnalyticsQueryResult } from "./get-journal-analytics-query-result.lib";
import { getJournalAnalyticsAnswer } from "./get-journal-analytics-answer.lib";
import {
  JournalAnalyticsPresetPlanName,
  type JournalAnalyticsAnswer,
} from "./journal-analytics-ai.types";
import type { JournalAnalyticsQueryResult } from "./journal-analytics-query.types";

export const runJournalAnalyticsAiQuery = ({
  since,
  preset,
  question,
}: {
  since: string;
  preset: JournalAnalyticsPresetPlanName;
  question: string;
}): EitherAsync<
  unknown,
  {
    plan: ReturnType<typeof getJournalAnalyticsPresetPlan>;
    analytics: JournalAnalyticsQueryResult;
    answer: JournalAnalyticsAnswer;
  }
> =>
  EitherAsync(async ({ fromPromise, throwE }) => {
    const plan = getJournalAnalyticsPresetPlan({ preset });
    const analytics = await fromPromise(
      getJournalAnalyticsQueryResult({ since, requests: plan.requests }).run(),
    );

    try {
      const answer = await getJournalAnalyticsAnswer({
        question,
        plan,
        analytics,
      });

      return {
        plan,
        analytics,
        answer,
      };
    } catch (error) {
      return throwE(error);
    }
  });
