import { Journal, TotalLevelsByTypeAndValue } from "../journal.types";
import {
  getTotalLevelsByTypeAndValue,
  maxLevel,
} from "./journal-analytics-chart-math.lib";

export type PieChartData = {
  level: "1" | "2" | "3" | "4" | "5";
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
      levelData.push({
        name: level.name,
        level: i.toString() as PieChartData[0][0]["level"],
        count: level[i.toString() as PieChartData[0][0]["level"]],
      });
    }

    result.push(levelData);
  }

  return result;
};
