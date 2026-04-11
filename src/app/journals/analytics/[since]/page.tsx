import { EitherAsync } from "purify-ts/EitherAsync";
import { RadarChart } from "./radar-chart";
import { Heading } from "@/components/heading";
import { redirect } from "next/navigation";
import { parseSinceRange } from "../../lib/parse-since-range.lib";
import { getJournalLevelsAnalytics } from "../../model/get-journal-levels-analytics.model";
import { LevelChartsTabs } from "./level-charts-tabs";
import { SinceFilterForm } from "../../components/since-filter-form";
import { Fieldset } from "@/components/fieldset";
import {
  getSentimentValenceInfo,
  SENTIMENT_VALENCE_BUCKET_LABELS,
} from "../../lib/get-sentiment-valence-info.lib";
import { SentimentLineChart } from "./sentiment-line-chart";
import { AnalyticsAssistant } from "./analytics-assistant";

const AnalyticsPage: React.FC<{ params: Promise<{ since: string }> }> = async ({
  params,
}) => {
  const { since: unsafeSince } = await params;

  const page = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const { since, from, to } = await liftEither(parseSinceRange(unsafeSince));

    const { radar, pie, line, ai } = await fromPromise(
      getJournalLevelsAnalytics({ from, to }).run(),
    );
    const averageValenceInfo =
      typeof ai.averageSentimentValence === "number"
        ? getSentimentValenceInfo(ai.averageSentimentValence)
        : undefined;
    const valenceBucketClassNames = {
      veryPositive: getSentimentValenceInfo(0.8).className,
      positive: getSentimentValenceInfo(0.4).className,
      mixed: getSentimentValenceInfo(0).className,
      negative: getSentimentValenceInfo(-0.4).className,
      veryNegative: getSentimentValenceInfo(-0.8).className,
    };

    return (
      <section className="space-y-2 text-center items-center flex flex-col">
        <Heading level={1}>Journal analytics</Heading>

        <SinceFilterForm
          className="flex max-w-fit items-end space-x-2"
          action={async (formData) => {
            "use server";
            const sinceRaw = formData.get("since");
            const nextSince =
              typeof sinceRaw === "string" &&
              parseSinceRange(sinceRaw.trim()).isRight()
                ? sinceRaw.trim()
                : since;

            redirect(`/journals/analytics/${nextSince}`);
          }}
          defaultSince={since}
        />

        <div className="space-y-2 text-center flex flex-col items-center">
          <div className="space-y-8">
            <Fieldset legend="Ratings" className="text-left">
              <div className="space-y-8">
                <RadarChart data={radar} />

                <LevelChartsTabs pie={pie} line={line} />
              </div>
            </Fieldset>

            <Fieldset legend="Sentiment over time" className="text-left">
              {ai.sentimentTimeline.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Not enough sentiment data yet.
                </p>
              ) : (
                <SentimentLineChart data={ai.sentimentTimeline} />
              )}
            </Fieldset>

            <AnalyticsAssistant since={since} />

            <Fieldset legend="AI analytics" className="text-left">
              <div className="space-y-3 text-sm">
                <p>
                  Entries in range: <strong>{ai.totalEntries}</strong>
                </p>

                <p>
                  Entries with analysis: <strong>{ai.analyzedCount}</strong>
                </p>

                <p>
                  Average sentiment:{" "}
                  <strong
                    className={averageValenceInfo?.className}
                    title={averageValenceInfo?.title}
                  >
                    {averageValenceInfo?.label ?? "n/a"}
                  </strong>
                </p>

                <div className="space-y-1">
                  <p className="font-medium">Sentiment</p>
                  <ul className="list-disc ml-4">
                    <li className={valenceBucketClassNames.veryPositive}>
                      {SENTIMENT_VALENCE_BUCKET_LABELS.veryPositive}:{" "}
                      {ai.sentimentValenceBucketCounts.veryPositive}
                    </li>
                    <li className={valenceBucketClassNames.positive}>
                      {SENTIMENT_VALENCE_BUCKET_LABELS.positive}:{" "}
                      {ai.sentimentValenceBucketCounts.positive}
                    </li>
                    <li className={valenceBucketClassNames.mixed}>
                      {SENTIMENT_VALENCE_BUCKET_LABELS.mixed}:{" "}
                      {ai.sentimentValenceBucketCounts.mixed}
                    </li>
                    <li className={valenceBucketClassNames.negative}>
                      {SENTIMENT_VALENCE_BUCKET_LABELS.negative}:{" "}
                      {ai.sentimentValenceBucketCounts.negative}
                    </li>
                    <li className={valenceBucketClassNames.veryNegative}>
                      {SENTIMENT_VALENCE_BUCKET_LABELS.veryNegative}:{" "}
                      {ai.sentimentValenceBucketCounts.veryNegative}
                    </li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <p className="font-medium">Top tracked activities</p>

                  {ai.topActivities.length === 0 ? (
                    <p className="text-zinc-600 dark:text-zinc-300">
                      No tracked activities yet.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {ai.topActivities.map((activity) => (
                        <li key={activity.key}>
                          {activity.groupLabel} / {activity.label}:{" "}
                          <strong>{activity.count}</strong> days (
                          {activity.percentOfEntries}%)
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Fieldset>

            <Fieldset legend="Activity impact" className="text-left">
              {ai.activityImpact.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  No activity data yet.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4">
                    Δ compares average rating on days with the activity vs days
                    without it.
                  </p>

                  <div className="w-full overflow-x-auto overscroll-x-contain max-w-[90vw]">
                    <table className="min-w-[52rem] text-sm">
                      <thead>
                        <tr className="text-left border-b border-zinc-200 dark:border-zinc-700">
                          <th className="py-1 pr-3 whitespace-nowrap">Activity</th>
                          <th className="py-1 pr-3 whitespace-nowrap">Days</th>
                          <th className="py-1 pr-3 whitespace-nowrap">
                            Mood avg
                          </th>
                          <th className="py-1 pr-3 whitespace-nowrap">
                            Mood Δ
                          </th>
                          <th className="py-1 pr-3 whitespace-nowrap">
                            Energy avg
                          </th>
                          <th className="py-1 pr-3 whitespace-nowrap">
                            Energy Δ
                          </th>
                          <th className="py-1 pr-3 whitespace-nowrap">
                            Productivity avg
                          </th>
                          <th className="py-1 pr-3 whitespace-nowrap">
                            Productivity Δ
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ai.activityImpact.map((activity) => (
                          <tr
                            key={activity.key}
                            className="border-b border-zinc-100 dark:border-zinc-800"
                          >
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {activity.groupLabel} / {activity.label}
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {activity.count} ({activity.percentOfEntries}%)
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {typeof activity.averageMood === "number"
                                ? activity.averageMood.toFixed(2)
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {typeof activity.moodDelta === "number"
                                ? `${activity.moodDelta > 0 ? "+" : ""}${activity.moodDelta.toFixed(2)}`
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {typeof activity.averageEnergy === "number"
                                ? activity.averageEnergy.toFixed(2)
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {typeof activity.energyDelta === "number"
                                ? `${activity.energyDelta > 0 ? "+" : ""}${activity.energyDelta.toFixed(2)}`
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {typeof activity.averageProductivity === "number"
                                ? activity.averageProductivity.toFixed(2)
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {typeof activity.productivityDelta === "number"
                                ? `${activity.productivityDelta > 0 ? "+" : ""}${activity.productivityDelta.toFixed(2)}`
                                : "n/a"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Fieldset>

            <Fieldset
              legend="Most helpful activities (experimental)"
              className="text-left"
            >
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4">
                Ranked by positive deltas and frequency. Minimum sample size:{" "}
                {ai.minSampleSizeForRanking} days with and without the activity.
              </p>

              {ai.helpfulActivities.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Not enough data for a reliable ranking yet.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {ai.helpfulActivities.map((activity, index) => (
                    <li key={activity.key}>
                      {index + 1}. <strong>{activity.groupLabel} / {activity.label}</strong> — score{" "}
                      {activity.score.toFixed(3)} · mood Δ{" "}
                      {activity.moodDelta > 0 ? "+" : ""}
                      {activity.moodDelta.toFixed(2)} · energy Δ{" "}
                      {activity.energyDelta > 0 ? "+" : ""}
                      {activity.energyDelta.toFixed(2)} · productivity Δ{" "}
                      {activity.productivityDelta > 0 ? "+" : ""}
                      {activity.productivityDelta.toFixed(2)} ({activity.count} days,{" "}
                      {activity.percentOfEntries}%)
                    </li>
                  ))}
                </ul>
              )}
            </Fieldset>
          </div>
        </div>
      </section>
    );
  })
    .mapLeft((error) => {
      return (
        <div className="space-y-2">
          <p className="text-sm text-zinc-600">
            Failed to load journal analytics.
          </p>
          <pre className="text-xs text-red-800">{String(error)}</pre>
        </div>
      );
    })
    .run();

  return page.extract();
};

export default AnalyticsPage;
