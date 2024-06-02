import { Either } from "purify-ts/Either";
import { CreatedAtLocal } from "./journal.types";
import { NonEmptyList } from "purify-ts/NonEmptyList";

export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getDateInfo = (
  createdAtLocal: CreatedAtLocal,
): Either<string, { year: number; month: number; day: number }> => {
  return NonEmptyList.fromArray(createdAtLocal.split("-"))
    .map((list) => list.map(Number))
    .map((x) => {
      return { year: x[0], month: x[1], day: x[2] };
    })
    .toEither("Invalid createdAtLocal");
};

export const prettyDate = (
  createdAtLocal: CreatedAtLocal,
  options: { withYear: boolean } = { withYear: true },
): string => {
  return getDateInfo(createdAtLocal)
    .map((x) => {
      if (options.withYear) {
        return `${months[x.month - 1]} ${x.day}, ${x.year}`;
      }

      return `${months[x.month - 1]} ${x.day}`;
    })
    .orDefault(createdAtLocal);
};

interface CreatedAtLocalGroup {
  [year: number]: Record<number /* month */, CreatedAtLocal[]>;
}

export const groupCreatedAtLocals = (
  createdAtLocals: CreatedAtLocal[],
): CreatedAtLocalGroup => {
  const result: CreatedAtLocalGroup = {};

  for (const createdAtLocal of createdAtLocals) {
    const dateInfo = getDateInfo(createdAtLocal);

    if (dateInfo.isRight()) {
      const { year, month } = dateInfo.extract();

      if (!result[year]) {
        result[year] = { [month]: [createdAtLocal] };
        continue;
      }

      if (!result[year][month]) {
        result[year][month] = [createdAtLocal];
        continue;
      }

      result[year][month] = result[year][month].concat(createdAtLocal);
    }
  }

  return result;
};
