import { EitherAsync } from "purify-ts/EitherAsync";
import { list } from "@/lib/blob/list";
import { del } from "@/lib/blob/del";
import { copy } from "@/lib/blob/copy";
import { CreatedAtLocal } from "../journal.types";
import { getJournalImagePrefix } from "./get-journal-image-prefix.lib";

export const moveJournalImagesIfTheyExist = ({
  fromCreatedAtLocal,
  toCreatedAtLocal,
}: {
  fromCreatedAtLocal: CreatedAtLocal;
  toCreatedAtLocal: CreatedAtLocal;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise }) => {
    const fromPrefix = getJournalImagePrefix({
      createdAtLocal: fromCreatedAtLocal,
    });

    const toPrefix = getJournalImagePrefix({
      createdAtLocal: toCreatedAtLocal,
    });

    const result = await fromPromise(
      list({
        options: { prefix: fromPrefix },
      }),
    );

    if (result.blobs.length === 0) {
      return;
    }

    for (const blob of result.blobs) {
      const suffix = blob.pathname.replace(fromPrefix, "");

      await fromPromise(
        copy({
          fromUrlOrPathname: blob.url,
          toPathname: `${toPrefix}${suffix}`,
          options: {
            access: "public",
            addRandomSuffix: true,
          },
        }),
      );
    }

    await fromPromise(del({ urls: result.blobs.map((blob) => blob.url) }));
  });
};
