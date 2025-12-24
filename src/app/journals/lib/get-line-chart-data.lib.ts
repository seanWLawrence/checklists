import { Journal, TotalLevelsByTypeAndValue } from "../journal.types";
import { getTotalLevelsByTypeAndValue } from "./journal-analytics-chart-math.lib";

export type LineChartData = (Pick<
  Journal,
  | "energyLevel"
  | "moodLevel"
  | "healthLevel"
  | "creativityLevel"
  | "relationshipsLevel"
> & {
  dateMilli: number;
  energyLevelAvg7?: number;
  moodLevelAvg7?: number;
  healthLevelAvg7?: number;
  creativityLevelAvg7?: number;
  relationshipsLevelAvg7?: number;
})[];

const rollingAverage = (
  data: LineChartData,
  key: keyof LineChartData[number],
  avgKey: keyof LineChartData[number],
): LineChartData => {
  const windowSize = 7;

  return data.map((row, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const slice = data.slice(start, index + 1);
    const values = slice
      .map((item) => item[key])
      .filter((value): value is number => typeof value === "number");

    const total = values.reduce((sum, value) => sum + value, 0);
    const avg =
      values.length > 0
        ? Number((total / values.length).toFixed(2))
        : undefined;

    return { ...row, [avgKey]: avg };
  });
};

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

  const sorted = [...result].sort((a, b) => a.dateMilli - b.dateMilli);

  return rollingAverage(
    rollingAverage(
      rollingAverage(
        rollingAverage(
          rollingAverage(sorted, "energyLevel", "energyLevelAvg7"),
          "moodLevel",
          "moodLevelAvg7",
        ),
        "healthLevel",
        "healthLevelAvg7",
      ),
      "creativityLevel",
      "creativityLevelAvg7",
    ),
    "relationshipsLevel",
    "relationshipsLevelAvg7",
  );
};
