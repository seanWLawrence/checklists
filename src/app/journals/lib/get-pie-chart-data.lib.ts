import { Codec, GetType } from "purify-ts/Codec";
import { Journal, TotalRatingsByTypeAndValue } from "../journal.types";
import {
  getTotalRatingsByTypeAndValue,
  maxLevel,
} from "./journal-analytics-chart-math.lib";
import { Left, Right } from "purify-ts/Either";

type IPieChartLevel = "1" | "2" | "3" | "4" | "5";

const PieChartLevel = Codec.custom<IPieChartLevel>({
  encode: (level) => level,
  decode: (level) => {
    if (
      level === "1" ||
      level === "2" ||
      level === "3" ||
      level === "4" ||
      level === "5"
    ) {
      return Right(level);
    }
    return Left(`Invalid level: ${level}`);
  },
});

type PieChartLevel = GetType<typeof PieChartLevel>;

export type PieChartData = {
  level: PieChartLevel;
  name: string;
  count: number;
}[][];

export const getPieChartData = (journals: Journal[]): PieChartData => {
  const totalRatingsByTypeAndValue: TotalRatingsByTypeAndValue =
    getTotalRatingsByTypeAndValue(journals);

  const result: PieChartData = [];

  for (const rating of Object.values(totalRatingsByTypeAndValue)) {
    const levelData: PieChartData[0] = [];

    for (let i = 1; i <= maxLevel; i++) {
      const pieChartLevelEither = PieChartLevel.decode(i.toString());

      if (pieChartLevelEither.isRight()) {
        const pieChartLevel = pieChartLevelEither.extract();

        levelData.push({
          name: rating.name,
          level: pieChartLevel,
          count: rating[pieChartLevel],
        });
      }
    }

    result.push(levelData);
  }

  return result;
};
