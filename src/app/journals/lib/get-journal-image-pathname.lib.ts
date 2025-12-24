import { CreatedAtLocal } from "../journal.types";
import { getJournalImagePrefix } from "./get-journal-image-prefix.lib";

export const getJournalImagePathname = ({
  createdAtLocal,
  imageName,
}: {
  createdAtLocal: CreatedAtLocal;
  imageName: string;
}): string => `${getJournalImagePrefix({ createdAtLocal })}${imageName}`;
