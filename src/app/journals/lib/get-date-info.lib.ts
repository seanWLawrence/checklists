import { Either, NonEmptyList } from "purify-ts";
import { CreatedAtLocal } from "../journal.types";

export const getDateInfo = (
  createdAtLocal: CreatedAtLocal,
): Either<string, { year: number; month: number; day: number }> => {
  return NonEmptyList.fromArray(createdAtLocal.split("-"))
    .map((list) => list.map(Number))
    .map((x) => {
      return { year: x[0], month: x[1], day: x[2] };
    })
    .toEither("Invalid createdAtLocal");
};
