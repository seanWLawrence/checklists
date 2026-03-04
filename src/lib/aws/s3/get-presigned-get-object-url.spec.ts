import { beforeEach, test, vi } from "vitest";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

vi.mock("./s3-client", () => ({
  s3Client: { mocked: true },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getPresignedGetObjectUrl } from "./get-presigned-get-object-url";

beforeEach(() => {
  vi.clearAllMocks();
});

test("passes through an explicit response content type override", async ({
  expect,
}) => {
  vi.mocked(getSignedUrl).mockResolvedValueOnce("https://example.com/audio");

  const result = await getPresignedGetObjectUrl({
    filename: "journal-audio.m4a",
    responseContentType: "audio/mp4",
  }).run();

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toBe("https://example.com/audio");
  expect(getSignedUrl).toHaveBeenCalledTimes(1);
  expect(vi.mocked(getSignedUrl).mock.calls[0]?.[1]).toMatchObject({
    input: {
      Bucket: "test-bucket",
      Key: "journal-audio.m4a",
      ResponseContentType: "audio/mp4",
    },
  });
});
