import {
  JournalLevels,
  RadarChartData,
  TotalLevelsByTypeAndValue,
} from "../journal.types";
import {
  getTotalLevelsByTypeAndValue,
  average,
  median,
  mode,
  percentile,
  maxLevel,
} from "./journal-analytics-chart-math.lib";

export const getRadarChartData = (levels: JournalLevels[]): RadarChartData => {
  const totalLevelsByTypeAndValue: TotalLevelsByTypeAndValue =
    getTotalLevelsByTypeAndValue(levels);

  const total = levels.length;

  return [
    {
      name: "Energy",
      levelType: "energyLevel" as const,
      average: average({
        total,
        num: totalLevelsByTypeAndValue.energyLevel.total,
      }),
      median: median(totalLevelsByTypeAndValue.energyLevel.levels),
      mode: mode(totalLevelsByTypeAndValue.energyLevel),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalLevelsByTypeAndValue.energyLevel,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalLevelsByTypeAndValue.energyLevel,
      }),
      fullMark: maxLevel,
    },
    {
      name: "Mood",
      levelType: "moodLevel" as const,
      average: average({
        total,
        num: totalLevelsByTypeAndValue.moodLevel.total,
      }),
      median: median(totalLevelsByTypeAndValue.moodLevel.levels),
      mode: mode(totalLevelsByTypeAndValue.moodLevel),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalLevelsByTypeAndValue.moodLevel,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalLevelsByTypeAndValue.moodLevel,
      }),
      fullMark: maxLevel,
    },
    {
      name: "Health",
      levelType: "healthLevel" as const,
      average: average({
        total,
        num: totalLevelsByTypeAndValue.healthLevel.total,
      }),
      median: median(totalLevelsByTypeAndValue.healthLevel.levels),
      mode: mode(totalLevelsByTypeAndValue.healthLevel),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalLevelsByTypeAndValue.healthLevel,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalLevelsByTypeAndValue.healthLevel,
      }),
      fullMark: maxLevel,
    },
    {
      name: "Creativity",
      levelType: "creativityLevel" as const,
      average: average({
        total,
        num: totalLevelsByTypeAndValue.creativityLevel.total,
      }),
      median: median(totalLevelsByTypeAndValue.creativityLevel.levels),
      mode: mode(totalLevelsByTypeAndValue.creativityLevel),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalLevelsByTypeAndValue.creativityLevel,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalLevelsByTypeAndValue.creativityLevel,
      }),
      fullMark: maxLevel,
    },
    {
      name: "Relation",
      levelType: "relationshipsLevel" as const,
      average: average({
        total,
        num: totalLevelsByTypeAndValue.relationshipsLevel.total,
      }),
      median: median(totalLevelsByTypeAndValue.relationshipsLevel.levels),
      mode: mode(totalLevelsByTypeAndValue.relationshipsLevel),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalLevelsByTypeAndValue.relationshipsLevel,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalLevelsByTypeAndValue.relationshipsLevel,
      }),
      fullMark: maxLevel,
    },
  ];
};
