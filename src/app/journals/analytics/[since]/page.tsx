import { EitherAsync } from "purify-ts/EitherAsync";
import { RadarChart } from "./radar-chart";
import { Heading } from "@/components/heading";
import { redirect } from "next/navigation";
import { parseSinceRange } from "../../lib/parse-since-range.lib";
import { getJournalLevelsAnalytics } from "../../model/get-journal-levels-analytics.model";
import { LevelChartsTabs } from "./level-charts-tabs";
import { SinceFilterForm } from "../../components/since-filter-form";
import { Fieldset } from "@/components/fieldset";
import dynamic from "next/dynamic";

const SentimentLineChart = dynamic(
  () => import("./sentiment-line-chart").then((mod) => mod.SentimentLineChart),
  { ssr: false, loading: () => <div className="min-h-[200px]" /> },
);

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

    return (
      <section className="space-y-2 text-center items-center flex flex-col">
        <Heading level={1}>Journal analytics</Heading>

        <SinceFilterForm
          className="flex max-w-fit items-end space-x-2"
          action={async (formData) => {
            "use server";
            const since = formData.get("since");

            redirect(`/journals/analytics/${since}`);
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
                  Average sentiment valence:{" "}
                  <strong>
                    {typeof ai.averageSentimentValence === "number"
                      ? ai.averageSentimentValence.toFixed(2)
                      : "n/a"}
                  </strong>
                </p>

                <div className="space-y-1">
                  <p className="font-medium">Sentiment labels</p>
                  <ul className="list-disc ml-4">
                    <li>Positive: {ai.sentimentLabelCounts.positive}</li>
                    <li>Neutral: {ai.sentimentLabelCounts.neutral}</li>
                    <li>Mixed: {ai.sentimentLabelCounts.mixed}</li>
                    <li>Negative: {ai.sentimentLabelCounts.negative}</li>
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
                          {habit.label}: <strong>{habit.count}</strong> days ({habit.percentOfEntries}%)
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

            <Fieldset legend="Habit impact" className="text-left">
              {ai.habitImpact.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  No habit data yet.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Δ compares average level on days with the habit vs days without it.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-zinc-200 dark:border-zinc-700">
                          <th className="py-1 pr-3">Habit</th>
                          <th className="py-1 pr-3">Days</th>
                          <th className="py-1 pr-3">Mood avg</th>
                          <th className="py-1 pr-3">Mood Δ</th>
                          <th className="py-1 pr-3">Energy avg</th>
                          <th className="py-1 pr-3">Energy Δ</th>
                          <th className="py-1 pr-3">Health avg</th>
                          <th className="py-1 pr-3">Health Δ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ai.habitImpact.map((habit) => (
                          <tr
                            key={habit.key}
                            className="border-b border-zinc-100 dark:border-zinc-800"
                          >
                            <td className="py-1 pr-3">{habit.label}</td>
                            <td className="py-1 pr-3">
                              {habit.count} ({habit.percentOfEntries}%)
                            </td>
                            <td className="py-1 pr-3">
                              {typeof habit.averageMood === "number"
                                ? habit.averageMood.toFixed(2)
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3">
                              {typeof habit.moodDelta === "number"
                                ? `${habit.moodDelta > 0 ? "+" : ""}${habit.moodDelta.toFixed(2)}`
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3">
                              {typeof habit.averageEnergy === "number"
                                ? habit.averageEnergy.toFixed(2)
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3">
                              {typeof habit.energyDelta === "number"
                                ? `${habit.energyDelta > 0 ? "+" : ""}${habit.energyDelta.toFixed(2)}`
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3">
                              {typeof habit.averageHealth === "number"
                                ? habit.averageHealth.toFixed(2)
                                : "n/a"}
                            </td>
                            <td className="py-1 pr-3">
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
