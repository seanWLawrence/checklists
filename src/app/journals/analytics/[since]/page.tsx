import { EitherAsync } from "purify-ts/EitherAsync";
import { RadarChart } from "./radar-chart";
import { Heading } from "@/components/heading";
import { redirect } from "next/navigation";
import { parseSinceRange } from "../../lib/parse-since-range.lib";
import { getJournalLevelsAnalytics } from "../../model/get-journal-levels-analytics.model";
import { LevelChartsTabs } from "./level-charts-tabs";
import { SinceFilterForm } from "../../components/since-filter-form";
import { Fieldset } from "@/components/fieldset";

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
