import { Journal, TotalLevelsByTypeAndValue } from "../journal.types";
import { getTotalLevelsByTypeAndValue } from "./journal-analytics-chart-math.lib";

export type LineChartData = (Pick<
  Journal,
  | "energyLevel"
  | "moodLevel"
  | "healthLevel"
  | "creativityLevel"
  | "relationshipsLevel"
> & { date: string })[];

export const getLineChartData = (journals: Journal[]): LineChartData => {
  const totalLevelsByTypeAndValue: TotalLevelsByTypeAndValue =
    getTotalLevelsByTypeAndValue(journals);

  const result: LineChartData = [];

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
  });

  totalLevelsByTypeAndValue.creativityLevel.levels.forEach(
    ({ level, updatedAtIso }, index) => {
      result.push({
        date: dateFormatter.format(updatedAtIso),
        creativityLevel: level,
        energyLevel: totalLevelsByTypeAndValue.energyLevel.levels[index].level,
        healthLevel: totalLevelsByTypeAndValue.healthLevel.levels[index].level,
        relationshipsLevel:
          totalLevelsByTypeAndValue.relationshipsLevel.levels[index].level,
        moodLevel: totalLevelsByTypeAndValue.moodLevel.levels[index].level,
      });
    },
  );

  return result;
};
