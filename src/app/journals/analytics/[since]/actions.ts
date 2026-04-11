"use server";

import { Codec } from "purify-ts/Codec";

import { Since } from "../../journal.types";
import {
  JournalAnalyticsPresetPlanName,
  type JournalAnalyticsAnswer,
} from "../../lib/journal-analytics-ai.types";
import { runJournalAnalyticsAiQuery } from "../../lib/run-journal-analytics-ai-query.lib";

export type SummarizeJournalAnalyticsPeriodActionResult =
  | {
      ok: true;
      answer: JournalAnalyticsAnswer;
    }
  | {
      ok: false;
      error: string;
    };

const SummarizeJournalAnalyticsPeriodPayload = Codec.interface({
  since: Since,
  preset: JournalAnalyticsPresetPlanName,
});

export const summarizeJournalAnalyticsPeriodAction = async (
  _prevState: SummarizeJournalAnalyticsPeriodActionResult,
  formData: FormData,
): Promise<SummarizeJournalAnalyticsPeriodActionResult> => {
  const decoded = SummarizeJournalAnalyticsPeriodPayload.decode({
    since: formData.get("since"),
    preset: formData.get("preset"),
  });

  if (decoded.isLeft()) {
    return {
      ok: false,
      error: String(decoded.extract()),
    };
  }

  const payload = decoded.unsafeCoerce();

  const result = await runJournalAnalyticsAiQuery({
    since: payload.since,
    preset: payload.preset,
    question: "Summarize this period",
  }).run();

  if (result.isLeft()) {
    return {
      ok: false,
      error: String(result.extract()),
    };
  }

  return {
    ok: true,
    answer: result.unsafeCoerce().answer,
  };
};
