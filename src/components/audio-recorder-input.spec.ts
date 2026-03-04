import { test } from "vitest";

import { normalizeRecordedMimeType } from "./audio-recorder-input";

test("normalizes codec-qualified mp4 recorder output to a stable audio type", ({
  expect,
}) => {
  expect(normalizeRecordedMimeType("audio/mp4;codecs=mp4a.40.2")).toBe(
    "audio/mp4",
  );
});

test("normalizes codec-qualified webm recorder output to a stable audio type", ({
  expect,
}) => {
  expect(normalizeRecordedMimeType("audio/webm;codecs=opus")).toBe(
    "audio/webm",
  );
});

test("leaves unknown recorder output types unchanged", ({ expect }) => {
  expect(normalizeRecordedMimeType("audio/x-custom")).toBe("audio/x-custom");
});
