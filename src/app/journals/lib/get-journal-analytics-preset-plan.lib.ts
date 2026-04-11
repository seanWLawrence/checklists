import { JournalAnalyticsRequestList } from "./journal-analytics-query.types";
import { JournalAnalyticsPresetPlanName } from "./journal-analytics-ai.types";

export const getJournalAnalyticsPresetPlan = ({
  preset,
}: {
  preset: JournalAnalyticsPresetPlanName;
}) => {
  if (preset !== "summarize-period") {
    throw new Error(`Unsupported journal analytics preset '${preset}'`);
  }

  const requests = JournalAnalyticsRequestList.decode([
    { kind: "overview" },
    { kind: "sentimentTimeline" },
    { kind: "activityImpact", minSampleSize: 5 },
    { kind: "helpfulActivities", limit: 5 },
  ]);

  if (requests.isLeft()) {
    throw new Error(String(requests.extract()));
  }

  return {
    preset,
    intent: "summary" as const,
    requests: requests.extract(),
    answerFormat: "sections" as const,
    instructions: [
      "Summarize the most important patterns from the period",
      "Highlight sentiment movement over time",
      "Identify activities associated with better outcomes",
      "Give 3 practical takeaways",
      "Mention weak evidence or sample-size limitations",
    ],
  };
};
