import { test } from "vitest";

import { getAudioExtractionArgs } from "./prepare-transcription-audio";

test("extracts compact mono AAC audio without video", ({ expect }) => {
  expect(
    getAudioExtractionArgs({
      inputPath: "/tmp/input.mp4",
      outputPath: "/tmp/audio.m4a",
    }),
  ).toEqual([
    "-y",
    "-i",
    "/tmp/input.mp4",
    "-vn",
    "-map",
    "0:a:0",
    "-ac",
    "1",
    "-c:a",
    "aac",
    "-b:a",
    "32k",
    "/tmp/audio.m4a",
  ]);
});
