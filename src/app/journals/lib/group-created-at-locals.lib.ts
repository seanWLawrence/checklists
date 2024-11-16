import { CreatedAtLocal } from "../journal.types";
import { getDateInfo } from "./get-date-info.lib";

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
