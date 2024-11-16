import { test } from "vitest";
import { getStringFromFormData } from "./get-string-from-form-data";

test("fails if name isnt found", ({ expect }) => {
  const formData = new FormData();

  const result = getStringFromFormData({
    name: "user",
    formData,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("Missing user");
});

test("fails if value isnt string", ({ expect }) => {
  const formData = new FormData();

  formData.set("user", new Blob());

  const result = getStringFromFormData({
    name: "user",
    formData,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("'user' is wrong type");
});

test("returns string if successful", ({ expect }) => {
  const formData = new FormData();

  formData.set("user", "some user");

  const result = getStringFromFormData({
    name: "user",
    formData,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toBe("some user");
});
