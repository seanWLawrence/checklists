import { test } from "vitest";

import { getLogBlockPreviewUrl } from "./get-log-block-preview-url";

test("getLogBlockPreviewUrl returns the filename-keyed preview for asset blocks", ({
  expect,
}) => {
  const result = getLogBlockPreviewUrl({
    block: {
      variant: "asset",
      assetVariant: "image",
      filename: "image/one.jpg",
      fileSizeBytes: undefined,
      transcription: undefined,
    },
    mediaPreviewUrlsByFilename: {
      "image/one.jpg": "https://example.com/one",
    },
  });

  expect(result.extract()).toBe("https://example.com/one");
});

test("getLogBlockPreviewUrl ignores non-asset blocks", ({ expect }) => {
  const result = getLogBlockPreviewUrl({
    block: {
      variant: "shortMarkdown",
      value: "notes",
    },
    mediaPreviewUrlsByFilename: {
      "image/one.jpg": "https://example.com/one",
    },
  });

  expect(result.isNothing()).toBe(true);
});
