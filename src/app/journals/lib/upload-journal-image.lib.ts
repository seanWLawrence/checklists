import { PutBlobResult } from "@vercel/blob";
import { EitherAsync } from "purify-ts";

import { put } from "@/lib/blob/put";
import { CreatedAtLocal } from "../journal.types";
import { getJournalImagePathname } from "./get-journal-image-pathname.lib";

export const uploadJournalImage = ({
  createdAtLocal,
  image,
}: {
  createdAtLocal: CreatedAtLocal;
  image: File;
}): EitherAsync<unknown, PutBlobResult> => {
  return put({
    pathname: getJournalImagePathname({
      createdAtLocal,
      imageName: image.name,
    }),
    body: image,
    options: {
      access: "public",
      addRandomSuffix: true,
      contentType: image.type,
    },
  });
};
