import { CreatedAtLocal } from "../journal.types";
import { getDateInfo } from "./get-date-info.lib";

const months = [
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
