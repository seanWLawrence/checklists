import {
  Journal,
  RadarChartData,
  TotalRatingsByTypeAndValue,
} from "../journal.types";
import {
  getTotalRatingsByTypeAndValue,
  average,
  median,
  mode,
  percentile,
  maxLevel,
} from "./journal-analytics-chart-math.lib";

export const getRadarChartData = (journals: Journal[]): RadarChartData => {
  const totalRatingsByTypeAndValue: TotalRatingsByTypeAndValue =
    getTotalRatingsByTypeAndValue(journals);

  return [
    {
      name: "Energy",
      ratingType: "energy" as const,
      average: average({
        count: totalRatingsByTypeAndValue.energy.ratings.length,
        num: totalRatingsByTypeAndValue.energy.total,
      }),
      median: median(totalRatingsByTypeAndValue.energy.ratings),
      mode: mode(totalRatingsByTypeAndValue.energy),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalRatingsByTypeAndValue.energy,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalRatingsByTypeAndValue.energy,
      }),
      fullMark: maxLevel,
    },
    {
      name: "Mood",
      ratingType: "mood" as const,
      average: average({
        count: totalRatingsByTypeAndValue.mood.ratings.length,
        num: totalRatingsByTypeAndValue.mood.total,
      }),
      median: median(totalRatingsByTypeAndValue.mood.ratings),
      mode: mode(totalRatingsByTypeAndValue.mood),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalRatingsByTypeAndValue.mood,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalRatingsByTypeAndValue.mood,
      }),
      fullMark: maxLevel,
    },
    {
      name: "Productivity",
      ratingType: "productivity" as const,
      average: average({
        count: totalRatingsByTypeAndValue.productivity.ratings.length,
        num: totalRatingsByTypeAndValue.productivity.total,
      }),
      median: median(totalRatingsByTypeAndValue.productivity.ratings),
      mode: mode(totalRatingsByTypeAndValue.productivity),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalRatingsByTypeAndValue.productivity,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalRatingsByTypeAndValue.productivity,
      }),
      fullMark: maxLevel,
    },
  ];
};
