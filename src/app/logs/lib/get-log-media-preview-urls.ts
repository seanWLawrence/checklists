import { EitherAsync } from "purify-ts/EitherAsync";

import { getPresignedGetObjectUrl } from "@/lib/aws/s3/get-presigned-get-object-url";
import { getJournalAssetResponseContentType } from "@/app/journals/lib/get-journal-asset-response-content-type.lib";
import { Block } from "../log.types";

export const getLogMediaPreviewUrls = ({
  blocks,
}: {
  blocks: Block[];
}): EitherAsync<unknown, Record<string, string>> => {
  const mediaEntries = blocks.flatMap((block) =>
    block.variant === "asset" && block.filename.trim() !== ""
      ? [{ filename: block.filename }]
      : [],
  );

  return EitherAsync.all(
    mediaEntries.map(({ filename }) =>
      EitherAsync(async ({ fromPromise }) => {
        const previewUrl = await fromPromise(
          getPresignedGetObjectUrl({
            filename,
            responseContentType: getJournalAssetResponseContentType({
              filename,
            }),
          }),
        );

        return { key: filename, previewUrl };
      }),
    ),
  ).map((items) =>
    Object.fromEntries(items.map((item) => [item.key, item.previewUrl])),
  );
};
