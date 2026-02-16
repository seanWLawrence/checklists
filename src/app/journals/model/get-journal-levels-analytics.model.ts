import { logger } from "@/lib/logger";
import { EitherAsync } from "purify-ts";
import { CreatedAtLocal, RadarChartData, Journal } from "../journal.types";
import { PieChartData, getPieChartData } from "../lib/get-pie-chart-data.lib";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { scan } from "@/lib/db/scan";
import { getAllItems } from "@/lib/db/get-all-items";
import { getRadarChartData } from "../lib/get-radar-chart-data.lib";
import { getAllJournalsScanKey } from "./get-all-created-at-locals.model";
import {
  getLineChartData,
  LineChartData,
} from "../lib/get-line-chart-data.lib";
import {
  getJournalAiAnalytics,
  JournalAiAnalytics,
} from "../lib/get-journal-ai-analytics.lib";

export const getJournalLevelsAnalytics = ({
  from,
  to,
}: {
  from?: CreatedAtLocal;
  to?: CreatedAtLocal;
}): EitherAsync<
  unknown,
  {
    radar: RadarChartData;
    pie: PieChartData;
    line: LineChartData;
    ai: JournalAiAnalytics;
  }
> => {
  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    const validatedKeys = await fromPromise(
      scan({
        key: getAllJournalsScanKey({ user }),
      }),
    );

    const levels = await fromPromise(
      getAllItems({ keys: validatedKeys, decoder: Journal }),
    );

    const filteredLevels =
      from || to
        ? levels.filter((x) => {
            const createdAt = new Date(x.createdAtLocal).getTime();

            const conditions: ((dateNum: number) => boolean)[] = [];

            if (from) {
              conditions.push(() => new Date(from).getTime() <= createdAt);
            }

            if (to) {
              conditions.push(() => new Date(to).getTime() >= createdAt);
            }

            return conditions.every((fn) => fn(createdAt));
          })
        : levels;

    return {
      radar: getRadarChartData(filteredLevels),
      pie: getPieChartData(filteredLevels),
      line: getLineChartData(filteredLevels),
      ai: getJournalAiAnalytics(filteredLevels),
    };
  })
    .ifRight(() => {
      logger.info(`Successfully loaded all journal levels`);
    })
    .ifLeft((e) => {
      logger.error(`Failed to load all journal levels`);
      logger.error(e);
    });
};
