import { List } from "purify-ts/List";
import { Journal } from "../journal.types";

export type LineChartData = Array<{
  dateMilli: number;
  energy?: number;
  mood?: number;
  productivity?: number;
  energyAvg7?: number;
  moodAvg7?: number;
  productivityAvg7?: number;
}>;

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
      energy: journal.checkIn.ratings?.energy,
      mood: journal.checkIn.ratings?.mood,
      productivity: journal.checkIn.ratings?.productivity,
    }))
    .filter((row) => {
      return (
        row.energy !== undefined ||
        row.mood !== undefined ||
        row.productivity !== undefined
      );
    })
    .sort((a, b) => a.dateMilli - b.dateMilli);

  return data.map((dataPoint, index) => {
    return {
      ...dataPoint,
      energyAvg7: rollingAverage({
        numDays: 7,
        data,
        index,
        dataKey: "energy",
      }),
      moodAvg7: rollingAverage({
        numDays: 7,
        data,
        index,
        dataKey: "mood",
      }),
      productivityAvg7: rollingAverage({
        numDays: 7,
        data,
        index,
        dataKey: "productivity",
      }),
    };
  });
};
