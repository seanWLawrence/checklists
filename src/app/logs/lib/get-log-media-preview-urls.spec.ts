import { Right } from "purify-ts";
import { test, vi } from "vitest";
import { getLogMediaPreviewUrls } from "./get-log-media-preview-urls";
import { getPresignedGetObjectUrl } from "@/lib/aws/s3/get-presigned-get-object-url";

vi.mock("@/lib/aws/s3/get-presigned-get-object-url", () => ({
  getPresignedGetObjectUrl: vi.fn(),
}));

test("getLogMediaPreviewUrls keys previews by filename", async ({ expect }) => {
  vi.mocked(getPresignedGetObjectUrl)
    .mockResolvedValueOnce(Right("https://example.com/one"))
    .mockResolvedValueOnce(Right("https://example.com/two"));

  const result = await getLogMediaPreviewUrls({
    blocks: [
      { variant: "shortMarkdown", value: "notes" },
      {
        variant: "asset",
        assetVariant: "image",
        filename: "image/one.jpg",
        fileSizeBytes: undefined,
      },
      {
        variant: "asset",
        assetVariant: "audio",
        filename: "audio/two.m4a",
        fileSizeBytes: undefined,
      },
    ],
  }).run();

  expect(result).toEqual(
    Right({
      "image/one.jpg": "https://example.com/one",
      "audio/two.m4a": "https://example.com/two",
    }),
  );
});
