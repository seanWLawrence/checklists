import { EitherAsync } from "purify-ts/EitherAsync";
import { RadarChart } from "./radar-chart";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Button } from "@/components/button";
import { redirect } from "next/navigation";
import { CreatedAtLocal, Since } from "../../journal.types";
import { getJournalLevelsAnalytics } from "../../model/get-journal-levels-analytics.model";
import PieCharts from "./pie-charts";

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
    const safeSince = await liftEither(Since.decode(unsafeSince));

    const [fromRaw, toRaw] = safeSince.split("to");
    const from = await liftEither(CreatedAtLocal.decode(fromRaw));
    const to = await liftEither(CreatedAtLocal.decode(toRaw));

    const { radar, pie } = await fromPromise(
      getJournalLevelsAnalytics({ from, to }).run(),
    );

    return (
      <section className="space-y-2 text-center items-center flex flex-col">
        <Heading level={1}>Journal analytics</Heading>

        <form
          className="flex max-w-fit items-end space-x-2"
          action={async (formData) => {
            "use server";
            const since = formData.get("since");

            redirect(`/journals/analytics/${since}`);
          }}
        >
          <Label
            label={
              <span className="flex flex-col space-y-1">
                <span>Since</span> <span>(YYYY-MM-DDtoYYYY-MM-DD)</span>
              </span>
            }
          >
            <Input
              name="since"
              defaultValue={safeSince}
              pattern="\d{4,}-\d{2,}-\d{2,}to\d{4,}-\d{2,}-\d{2,}"
              className="min-w-56"
            />
          </Label>

          <Button variant="primary">Filter</Button>
        </form>

        <div className="space-y-2 text-center flex flex-col items-center">
          <div className="space-y-8">
            <RadarChart data={radar} />

            <PieCharts data={pie} />
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
