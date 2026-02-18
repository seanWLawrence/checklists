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

/**
 * Get the date range from the route, default to last week
 * Add links to change the date range route to either last 2 weeks, last month, last 3 months, last 6 months, last year and all time
 * Pass the params from the route into the function and filter the keys to only ones with the date
 */
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
            <RadarChart data={radar} />

            <LevelChartsTabs pie={pie} line={line} />

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
                  <p className="font-medium">Top habits</p>

                  {ai.topHabits.length === 0 ? (
                    <p className="text-zinc-600 dark:text-zinc-300">
                      No tracked habits yet.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {ai.topHabits.map((habit) => (
                        <li key={habit.key}>
                          {habit.label}: <strong>{habit.count}</strong> days (
                          {habit.percentOfEntries}%)
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="font-medium">Top hobbies</p>

                  {ai.topHobbies.length === 0 ? (
                    <p className="text-zinc-600 dark:text-zinc-300">
                      No tracked hobbies yet.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {ai.topHobbies.map((hobby) => (
                        <li key={hobby.key}>
                          {hobby.label}: <strong>{hobby.count}</strong> days (
                          {hobby.percentOfEntries}%)
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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

            <Fieldset
              legend="Most helpful habits (experimental)"
              className="text-left"
            >
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Ranked by positive deltas and frequency. Minimum sample size:{" "}
                {ai.minSampleSizeForRanking} days with and without the habit.
              </p>

              {ai.helpfulHabits.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Not enough data for a reliable ranking yet.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {ai.helpfulHabits.map((habit, index) => (
                    <li key={habit.key}>
                      {index + 1}. <strong>{habit.label}</strong> — score{" "}
                      {habit.score.toFixed(3)} · mood Δ{" "}
                      {habit.moodDelta > 0 ? "+" : ""}
                      {habit.moodDelta.toFixed(2)} · energy Δ{" "}
                      {habit.energyDelta > 0 ? "+" : ""}
                      {habit.energyDelta.toFixed(2)} · health Δ{" "}
                      {habit.healthDelta > 0 ? "+" : ""}
                      {habit.healthDelta.toFixed(2)} ({habit.count} days,{" "}
                      {habit.percentOfEntries}%)
                    </li>
                  ))}
                </ul>
              )}
            </Fieldset>

            <Fieldset legend="Habit impact" className="text-left">
              {ai.habitImpact.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  No habit data yet.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Δ compares average level on days with the habit vs days
                    without it.
                  </p>

                  <div className="w-full overflow-x-auto overscroll-x-contain max-w-[90vw]">
                    <table className="min-w-[44rem] text-sm">
                      <thead>
                        <tr className="text-left border-b border-zinc-200 dark:border-zinc-700">
                          <th className="py-1 pr-3 whitespace-nowrap">Habit</th>
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
                            Health avg
                          </th>
                          <th className="py-1 pr-3 whitespace-nowrap">
                            Health Δ
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ai.habitImpact.map((habit) => (
                          <tr
                            key={habit.key}
                            className="border-b border-zinc-100 dark:border-zinc-800"
                          >
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {habit.label}
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {habit.count} ({habit.percentOfEntries}%)
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {typeof habit.averageMood === "number"
                                ? habit.averageMood.toFixed(2)
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {typeof habit.moodDelta === "number"
                                ? `${habit.moodDelta > 0 ? "+" : ""}${habit.moodDelta.toFixed(2)}`
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {typeof habit.averageEnergy === "number"
                                ? habit.averageEnergy.toFixed(2)
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {typeof habit.energyDelta === "number"
                                ? `${habit.energyDelta > 0 ? "+" : ""}${habit.energyDelta.toFixed(2)}`
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {typeof habit.averageHealth === "number"
                                ? habit.averageHealth.toFixed(2)
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3 whitespace-nowrap">
                              {typeof habit.healthDelta === "number"
                                ? `${habit.healthDelta > 0 ? "+" : ""}${habit.healthDelta.toFixed(2)}`
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
