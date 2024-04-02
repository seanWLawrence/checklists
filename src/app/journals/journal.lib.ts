import { Either } from "purify-ts/Either";
import { CreatedAtLocal, Journal } from "./journal.types";
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

interface JournalGroup {
  [year: number]: Record<number /* month */, Journal[]>;
}

export const groupJournals = (journals: Journal[]): JournalGroup => {
  const result: JournalGroup = {};

  for (const journal of journals) {
    const dateInfo = getDateInfo(journal.createdAtLocal);

    if (dateInfo.isRight()) {
      const { year, month } = dateInfo.extract();

      if (!result[year]) {
        result[year] = { [month]: [journal] };
        continue;
      }

      if (!result[year][month]) {
        result[year][month] = [journal];
        continue;
      }

      result[year][month] = result[year][month].concat(journal);
    }
  }

  return result;
};
