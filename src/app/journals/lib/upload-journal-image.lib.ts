import { EitherAsync } from "purify-ts";

import { put } from "@/lib/blob/put";
import { CreatedAtLocal } from "../journal.types";
import { getJournalImagePathname } from "./get-journal-image-pathname.lib";

export const uploadJournalImage = ({
  createdAtLocal,
  image,
  description,
}: {
  createdAtLocal: CreatedAtLocal;
  image: File;
  description?: string;
}): EitherAsync<unknown, void> => {
  return put({
    pathname: getJournalImagePathname({
      createdAtLocal,
      description,
      originalName: image.name,
    }),
    body: image,
    options: {
      access: "public",
      addRandomSuffix: true,
      contentType: image.type,
    },
  }).map(() => undefined);
};
