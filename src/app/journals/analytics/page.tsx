import { EitherAsync } from "purify-ts/EitherAsync";
import { getJournalLevelsRadarChartData } from "../journal.model";
import { RadarChart } from "./radar-chart";
import { Heading } from "@/components/heading";

const AnalyticsPage: React.FC = async () => {
  const node = await EitherAsync(async ({ fromPromise }) => {
    const radarChartData = await fromPromise(
      getJournalLevelsRadarChartData().run(),
    );

    return (
      <section className="space-y-2">
        <Heading level={1}>Journal analytics</Heading>

        <RadarChart data={radarChartData} />
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

  return node.toJSON();
};

export default AnalyticsPage;
