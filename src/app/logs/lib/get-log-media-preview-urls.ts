import { EitherAsync } from "purify-ts/EitherAsync";

import { getPresignedGetObjectUrl } from "@/lib/aws/s3/get-presigned-get-object-url";
import { getJournalAssetResponseContentType } from "@/app/journals/lib/get-journal-asset-response-content-type.lib";
import { LogSection } from "../log.types";

export const getLogMediaPreviewUrls = ({
  sections,
}: {
  sections: LogSection[];
}): EitherAsync<unknown, Record<string, string>> => {
  const mediaEntries = sections.flatMap((section, sectionIndex) =>
    section.blocks.flatMap((block, blockIndex) =>
      block.variant === "asset" && block.filename.trim() !== ""
        ? [{ sectionIndex, blockIndex, filename: block.filename }]
        : [],
    ),
  );

  return EitherAsync.all(
    mediaEntries.map(({ sectionIndex, blockIndex, filename }) =>
      EitherAsync(async ({ fromPromise }) => {
        const previewUrl = await fromPromise(
          getPresignedGetObjectUrl({
            filename,
            responseContentType: getJournalAssetResponseContentType({
              filename,
            }),
          }),
        );

        return {
          key: `${sectionIndex}-${blockIndex}`,
          previewUrl,
        };
      }),
    ),
  ).map((items) => Object.fromEntries(items.map((item) => [item.key, item.previewUrl])));
};
