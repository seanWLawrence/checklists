import { EitherAsync } from "purify-ts/EitherAsync";

import { getPresignedGetObjectUrl } from "@/lib/aws/s3/get-presigned-get-object-url";
import { getJournalAssetResponseContentType } from "@/app/journals/lib/get-journal-asset-response-content-type.lib";
import { Block } from "../log.types";

export const getLogMediaPreviewUrls = ({
  blocks,
}: {
  blocks: Block[];
}): EitherAsync<unknown, Record<string, string>> => {
  const mediaEntries = blocks.flatMap((block, blockIndex) =>
    block.variant === "asset" && block.filename.trim() !== ""
      ? [{ blockIndex, filename: block.filename }]
      : [],
  );

  return EitherAsync.all(
    mediaEntries.map(({ blockIndex, filename }) =>
      EitherAsync(async ({ fromPromise }) => {
        const previewUrl = await fromPromise(
          getPresignedGetObjectUrl({
            filename,
            responseContentType: getJournalAssetResponseContentType({
              filename,
            }),
          }),
        );

        return { key: `${blockIndex}`, previewUrl };
      }),
    ),
  ).map((items) =>
    Object.fromEntries(items.map((item) => [item.key, item.previewUrl])),
  );
};
