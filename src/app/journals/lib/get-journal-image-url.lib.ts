import { MaybeAsync } from "purify-ts/MaybeAsync";

import { list } from "@/lib/blob/list";
import { CreatedAtLocal } from "../journal.types";
import { getJournalImagePrefix } from "./get-journal-image-prefix.lib";
import { getJournalImageCaption } from "./get-journal-image-caption.lib";
import { Maybe } from "purify-ts/Maybe";

export const getJournalImageInfo = ({
  createdAtLocal,
}: {
  createdAtLocal: CreatedAtLocal;
}): MaybeAsync<{ url: string; caption: string }> => {
  return MaybeAsync(async ({ fromPromise, liftMaybe }) => {
    const listResponse = await fromPromise(
      list({
        options: { prefix: getJournalImagePrefix({ createdAtLocal }) },
      }).toMaybeAsync(),
    );

    const latest = [...listResponse.blobs].sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime(),
    )[0];

    await liftMaybe(Maybe.fromNullable(latest));

    return {
      url: latest.url,
      caption: getJournalImageCaption({ pathname: latest.pathname }),
    };
  });
};
