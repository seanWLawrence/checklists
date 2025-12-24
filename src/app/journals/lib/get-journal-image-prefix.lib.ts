import { CreatedAtLocal } from "../journal.types";

const ENVIRONMENT = process.env.NODE_ENV ?? "development";
const IMAGE_PREFIX = `${ENVIRONMENT}/journals/assets/images`;

export const getJournalImagePrefix = ({
  createdAtLocal,
}: {
  createdAtLocal: CreatedAtLocal;
}): string => `${IMAGE_PREFIX}/${createdAtLocal}/`;
