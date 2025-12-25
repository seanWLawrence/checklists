import { Maybe } from "purify-ts/Maybe";
import { CreatedAtLocal } from "../journal.types";

const ENVIRONMENT = Maybe.fromNullable(process.env.NODE_ENV).orDefault(
  "development",
);

const IMAGE_PREFIX = `${ENVIRONMENT}/journals/assets/images`;

export const getJournalImagePrefix = ({
  createdAtLocal,
}: {
  createdAtLocal: CreatedAtLocal;
}): string => `${IMAGE_PREFIX}/${createdAtLocal}/`;
