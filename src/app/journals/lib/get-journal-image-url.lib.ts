import { MaybeAsync } from "purify-ts/MaybeAsync";

import { list } from "@/lib/blob/list";
import { CreatedAtLocal } from "../journal.types";
import { getJournalImagePrefix } from "./get-journal-image-prefix.lib";

export const getJournalImageUrl = ({
  createdAtLocal,
}: {
  createdAtLocal: CreatedAtLocal;
}): MaybeAsync<string> => {
  return MaybeAsync(async ({ fromPromise }) => {
    const listResponse = await fromPromise(
      list({
        options: { prefix: getJournalImagePrefix({ createdAtLocal }) },
      }).toMaybeAsync(),
    );

    const latest = [...listResponse.blobs].sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime(),
    )[0];

    return latest?.url;
  });
};
