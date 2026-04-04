import { Maybe } from "purify-ts/Maybe";

import { Block } from "../log.types";

export const getLogBlockPreviewUrl = ({
  block,
  mediaPreviewUrlsByFilename,
}: {
  block: Block;
  mediaPreviewUrlsByFilename: Record<string, string>;
}): Maybe<string> => {
  if (block.variant !== "asset") {
    return Maybe.empty();
  }

  return Maybe.fromNullable(mediaPreviewUrlsByFilename[block.filename]);
};
