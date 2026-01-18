import { test } from "vitest";
import { getAudioFromFormData } from "./get-audio-from-form-data";

test("fails when missing file", ({ expect }) => {
  const formData = new FormData();

  const result = getAudioFromFormData({
    formData,
    name: "audio",
  }).swap();

  expect(result.extract()).toBe("Missing audio");
});

test("fails if wrong type", ({ expect }) => {
  const formData = new FormData();

  formData.set("audio", "not-a-file");

  const result = getAudioFromFormData({
    formData,
    name: "audio",
  }).swap();

  expect(result.extract()).toBe("'audio' is wrong type");
});

test("fails if file isnt an audio file", ({ expect }) => {
  const formData = new FormData();
  const file = new File(["hello"], "note.txt", { type: "text/plain" });

  formData.set("audio", file);

  const result = getAudioFromFormData({
    formData,
    name: "audio",
  }).swap();

  expect(result.extract()).toBe("'audio' is not an audio file");
});

test("returns audio file", ({ expect }) => {
  const formData = new FormData();
  const file = new File(["hello"], "note.m4a", { type: "audio/mp4" });

  formData.set("audio", file);

  const result = getAudioFromFormData({
    formData,
    name: "audio",
  });

  expect(result.extract()).toBe(file);
});
