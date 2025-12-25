import { Level } from "../journal.types";
import { LineChartData } from "./get-line-chart-data.lib";

const clampLevel = (num: number): number => Math.max(1, Math.min(5, num));

const averageWindow = (
  values: number[],
  index: number,
  windowSize: number,
): number => {
  const start = Math.max(0, index - windowSize + 1);
  const slice = values.slice(start, index + 1);
  const total = slice.reduce((sum, value) => sum + value, 0);

  return Number((total / slice.length).toFixed(2));
};

const baseDate = new Date("2024-01-01");
const rawLevels = Array.from({ length: 60 }, (_, index) => {
  return {
    dateMilli: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + index,
    ).getTime(),
    energyLevel: Level.decode(
      Math.round(clampLevel(3 + Math.sin(index / 4) * 2)),
    ).orDefault(1),
    moodLevel: Level.decode(
      Math.round(clampLevel(3 + Math.cos(index / 5) * 2)),
    ).orDefault(1),
    healthLevel: Level.decode(
      Math.round(clampLevel(3 + Math.sin(index / 6) * 2)),
    ).orDefault(1),
    creativityLevel: Level.decode(
      Math.round(clampLevel(3 + Math.cos(index / 7) * 2)),
    ).orDefault(1),
    relationshipsLevel: Level.decode(
      Math.round(clampLevel(3 + Math.sin(index / 8) * 2)),
    ).orDefault(1),
  };
});

export const stubLineChartData: LineChartData = rawLevels.map((row, index) => {
  return {
    ...row,
    energyLevelAvg7: averageWindow(
      rawLevels.map((item) => item.energyLevel),
      index,
      7,
    ),
    moodLevelAvg7: averageWindow(
      rawLevels.map((item) => item.moodLevel),
      index,
      7,
    ),
    healthLevelAvg7: averageWindow(
      rawLevels.map((item) => item.healthLevel),
      index,
      7,
    ),
    creativityLevelAvg7: averageWindow(
      rawLevels.map((item) => item.creativityLevel),
      index,
      7,
    ),
    relationshipsLevelAvg7: averageWindow(
      rawLevels.map((item) => item.relationshipsLevel),
      index,
      7,
    ),
  };
});
