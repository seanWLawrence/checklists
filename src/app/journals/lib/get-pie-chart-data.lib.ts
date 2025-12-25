import { Codec, GetType } from "purify-ts/Codec";
import { Journal, TotalLevelsByTypeAndValue } from "../journal.types";
import {
  getTotalLevelsByTypeAndValue,
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
  /**
   * @example "Energy (Level 1)"
   */
  name: string;
  count: number;
}[][];

export const getPieChartData = (journals: Journal[]): PieChartData => {
  const totalLevelsByTypeAndValue: TotalLevelsByTypeAndValue =
    getTotalLevelsByTypeAndValue(journals);

  const result: PieChartData = [];

  for (const level of Object.values(totalLevelsByTypeAndValue)) {
    const levelData: PieChartData[0] = [];

    for (let i = 1; i <= maxLevel; i++) {
      const pieChartLevelEither = PieChartLevel.decode(i.toString());

      if (pieChartLevelEither.isRight()) {
        const pieChartLevel = pieChartLevelEither.extract();

        levelData.push({
          name: level.name,
          level: pieChartLevel,
          count: level[pieChartLevel],
        });
      }
    }

    result.push(levelData);
  }

  return result;
};
