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

test("returns undefined for non-audio files", ({ expect }) => {
  expect(
    getJournalAssetResponseContentType({ filename: "photo.jpg" }),
  ).toBeUndefined();
});
