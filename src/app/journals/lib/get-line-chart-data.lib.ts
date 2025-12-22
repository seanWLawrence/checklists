import { Journal, TotalLevelsByTypeAndValue } from "../journal.types";
import { getTotalLevelsByTypeAndValue } from "./journal-analytics-chart-math.lib";

export type LineChartData = (Pick<
  Journal,
  | "energyLevel"
  | "moodLevel"
  | "healthLevel"
  | "creativityLevel"
  | "relationshipsLevel"
> & { dateMilli: number })[];

export const getLineChartData = (journals: Journal[]): LineChartData => {
  const totalLevelsByTypeAndValue: TotalLevelsByTypeAndValue =
    getTotalLevelsByTypeAndValue(journals);

  const result: LineChartData = [];

  totalLevelsByTypeAndValue.creativityLevel.levels.forEach(
    ({ level, updatedAtIso }, index) => {
      result.push({
        dateMilli: updatedAtIso.getTime(),
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
