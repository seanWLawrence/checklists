import { Either, Left, Right } from "purify-ts/Either";
import { CreatedAtLocal, Since } from "../journal.types";

export const parseSinceRange = (
  unsafeSince: string,
): Either<
  unknown,
  { from: CreatedAtLocal; to: CreatedAtLocal; since: string }
> => {
  return Since.decode(unsafeSince).chain((safeSince) => {
    const [fromRaw, toRaw] = safeSince.split("to");

    return Either.sequence([
      CreatedAtLocal.decode(fromRaw),
      CreatedAtLocal.decode(toRaw),
    ]).chain(([from, to]) => {
      if (from > to) {
        return Left(`Invalid since range: from '${from}' is after to '${to}'`);
      }

      return Right({ from, to, since: safeSince });
    });
  });
};
