import { test } from "vitest";
import { getImageFromFormData } from "./get-image-from-form-data";

test("fails if name isnt found", ({ expect }) => {
  const formData = new FormData();

  const result = getImageFromFormData({
    name: "image",
    formData,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("Missing image");
});

test("fails if value isnt a file", ({ expect }) => {
  const formData = new FormData();

  formData.set("image", "not-a-file");

  const result = getImageFromFormData({
    name: "image",
    formData,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("'image' is wrong type");
});

test("fails if file isnt an image", ({ expect }) => {
  const formData = new FormData();

  const file = new File(["hello"], "note.txt", { type: "text/plain" });
  formData.set("image", file);

  const result = getImageFromFormData({
    name: "image",
    formData,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("'image' is not an image");
});

test("returns file if successful", ({ expect }) => {
  const formData = new FormData();

  const file = new File(["hello"], "photo.png", { type: "image/png" });
  formData.set("image", file);

  const result = getImageFromFormData({
    name: "image",
    formData,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract().name).toBe("photo.png");
});
