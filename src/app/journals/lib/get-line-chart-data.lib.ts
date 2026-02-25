import { List } from "purify-ts/List";
import { Journal } from "../journal.types";

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
  const data = journals
    .map((journal) => ({
      dateMilli: journal.updatedAtIso.getTime(),
      creativityLevel: journal.creativityLevel,
      energyLevel: journal.energyLevel,
      healthLevel: journal.healthLevel,
      relationshipsLevel: journal.relationshipsLevel,
      moodLevel: journal.moodLevel,
    }))
    .filter((row) => {
      return (
        row.creativityLevel !== undefined ||
        row.energyLevel !== undefined ||
        row.healthLevel !== undefined ||
        row.relationshipsLevel !== undefined ||
        row.moodLevel !== undefined
      );
    })
    .sort((a, b) => a.dateMilli - b.dateMilli);

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
