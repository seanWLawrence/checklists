import { Maybe } from "purify-ts";
import { TimeEstimate } from "./types";

const unitToMinutes = { h: 60, m: 1 };

const getTimeEstimateInMinutes = (timeEstimate: TimeEstimate) => {
  return Maybe.fromNullable(timeEstimate.match(/^\d+/)?.[0])
    .map(Number)
    .chain((num) => {
      return Maybe.fromNullable(timeEstimate.match(/(m|h)$/)?.[0]).map(
        (unit) => {
          return { unit, num };
        },
      );
    })
    .map(({ unit, num }) => {
      return unitToMinutes[unit as keyof typeof unitToMinutes] * num;
    })
    .orDefault(0);
};

const roundToNearestHalf = (num: number): number => {
  return Math.round(num * 2) / 2;
};

const roundToNearestFive = (num: number): number => {
  return Math.round(num / 5) * 5;
};

const getTimeEstimateFromMinutes = (minutes: number): TimeEstimate => {
  if (minutes >= 60) {
    return `${roundToNearestHalf(minutes / 60)}h`;
  }

  return `${roundToNearestFive(minutes)}m`;
};

export const sumTimeEstimates = (
  timeEstimates: (TimeEstimate | undefined)[],
): TimeEstimate => {
  const sumInMinutes = timeEstimates.reduce((acc, x) => {
    acc += x ? getTimeEstimateInMinutes(x) : 0;

    return acc;
  }, 0);

  return getTimeEstimateFromMinutes(sumInMinutes);
};
