import { CreatedAtLocal } from "../journal.types";

export const getAdjacentCreatedAtLocals = ({
  createdAtLocal,
  createdAtLocals,
}: {
  createdAtLocal: CreatedAtLocal;
  createdAtLocals: CreatedAtLocal[];
}): {
  previousCreatedAtLocal?: CreatedAtLocal;
  nextCreatedAtLocal?: CreatedAtLocal;
} => {
  const sortedCreatedAtLocals = [...createdAtLocals].sort((a, b) =>
    a.localeCompare(b),
  );

  const index = sortedCreatedAtLocals.findIndex(
    (candidate) => candidate === createdAtLocal,
  );

  if (index === -1) {
    return {};
  }

  return {
    previousCreatedAtLocal:
      index > 0 ? sortedCreatedAtLocals[index - 1] : undefined,
    nextCreatedAtLocal:
      index < sortedCreatedAtLocals.length - 1
        ? sortedCreatedAtLocals[index + 1]
        : undefined,
  };
};
