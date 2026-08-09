import { test } from "vitest";

import {
  getMicrophoneAccessErrorMessage,
  getBackgroundPauseStrategy,
  normalizeRecordedMimeType,
  shouldRetryGetUserMediaWithoutConstraints,
} from "./audio-recorder-input";

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

test("uses segment strategy on iPhone user agents", ({ expect }) => {
  expect(
    getBackgroundPauseStrategy({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15",
      platform: "iPhone",
      maxTouchPoints: 5,
    }),
  ).toBe("segment");
});

test("uses segment strategy on iPadOS desktop-class user agents", ({
  expect,
}) => {
  expect(
    getBackgroundPauseStrategy({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15",
      platform: "MacIntel",
      maxTouchPoints: 5,
    }),
  ).toBe("segment");
});

test("uses pause strategy on desktop chrome", ({ expect }) => {
  expect(
    getBackgroundPauseStrategy({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/537.36 Chrome/130.0.0.0",
      platform: "MacIntel",
      maxTouchPoints: 0,
    }),
  ).toBe("pause");
});

test("retries getUserMedia without constraints for overconstrained errors", ({
  expect,
}) => {
  expect(
    shouldRetryGetUserMediaWithoutConstraints(
      new DOMException("", "OverconstrainedError"),
    ),
  ).toBe(true);
});

test("retries getUserMedia without constraints for type errors", ({
  expect,
}) => {
  expect(shouldRetryGetUserMediaWithoutConstraints(new TypeError())).toBe(true);
});

test("does not retry getUserMedia without constraints for denied access", ({
  expect,
}) => {
  expect(
    shouldRetryGetUserMediaWithoutConstraints(
      new DOMException("", "NotAllowedError"),
    ),
  ).toBe(false);
});

test("maps denied microphone errors to settings guidance", ({ expect }) => {
  expect(
    getMicrophoneAccessErrorMessage(new DOMException("", "NotAllowedError")),
  ).toContain("Check browser or iOS app settings");
});

test("maps missing microphone errors to a device-specific message", ({
  expect,
}) => {
  expect(
    getMicrophoneAccessErrorMessage(new DOMException("", "NotFoundError")),
  ).toBe("No microphone was found on this device.");
});
