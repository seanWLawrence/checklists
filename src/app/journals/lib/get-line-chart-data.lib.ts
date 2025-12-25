import { List } from "purify-ts/List";
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

const rollingAverage = ({
  index,
  numDays,
  data,
  dataKey,
}: {
  index: number;
  numDays: number;
  data: LineChartData;
  dataKey: keyof LineChartData[number];
}) => {
  const start = Math.max(0, index - numDays + 1);
  const slice = data.slice(start, index + 1);

  const values: number[] = [];

  for (const item of slice) {
    const value = item[dataKey];

    if (value !== undefined && typeof value === "number") {
      values.push(value);
    }
  }

  const total = List.sum(values);

  return values.length > 0
    ? Number((total / values.length).toFixed(2))
    : undefined;
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

  const data = [...result].sort((a, b) => a.dateMilli - b.dateMilli);

  return data.map((dataPoint, index) => {
    return {
      ...dataPoint,
      creativityLevelAvg7: rollingAverage({
        numDays: 7,
        data,
        index,
        dataKey: "creativityLevel",
      }),
      energyLevelAvg7: rollingAverage({
        numDays: 7,
        data,
        index,
        dataKey: "energyLevel",
      }),
      healthLevelAvg7: rollingAverage({
        numDays: 7,
        data,
        index,
        dataKey: "healthLevel",
      }),
      relationshipsLevelAvg7: rollingAverage({
        numDays: 7,
        data,
        index,
        dataKey: "relationshipsLevel",
      }),
      moodLevelAvg7: rollingAverage({
        numDays: 7,
        data,
        index,
        dataKey: "moodLevel",
      }),
    };
  });
};
