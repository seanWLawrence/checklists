import { EitherAsync } from "purify-ts/EitherAsync";

import { list } from "@/lib/blob/list";
import { del } from "@/lib/blob/del";
import { CreatedAtLocal } from "../journal.types";
import { getJournalImagePrefix } from "./get-journal-image-prefix.lib";

export const deleteJournalImages = ({
  createdAtLocal,
}: {
  createdAtLocal: CreatedAtLocal;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise }) => {
    const result = await fromPromise(
      list({
        options: { prefix: getJournalImagePrefix({ createdAtLocal }) },
      }),
    );

    const urls = result.blobs.map((blob) => blob.url);

    if (urls.length === 0) {
      return;
    }

    await fromPromise(del({ urls }));
  });
};
