import { test } from "vitest";

import { getJournalAssetResponseContentType } from "./get-journal-asset-response-content-type.lib";

test("maps legacy m4a filenames to a normalized response content type", ({
  expect,
}) => {
  expect(
    getJournalAssetResponseContentType({ filename: "journal-audio.m4a" }),
  ).toBe("audio/mp4");
});

test("maps opus filenames to an ogg response content type", ({ expect }) => {
  expect(
    getJournalAssetResponseContentType({ filename: "journal-audio.opus" }),
  ).toBe("audio/ogg");
});

test("maps mp4 filenames to a video response content type", ({ expect }) => {
  expect(
    getJournalAssetResponseContentType({ filename: "journal-video.mp4" }),
  ).toBe("video/mp4");
});

test("returns undefined for unsupported files", ({ expect }) => {
  expect(
    getJournalAssetResponseContentType({ filename: "photo.jpg" }),
  ).toBeUndefined();
});
