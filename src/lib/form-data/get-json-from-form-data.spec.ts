import { test } from "vitest";
import { getJsonFromFormData } from "./get-json-from-form-data";
import { User } from "../types";

test("fails if name isnt found", ({ expect }) => {
  const formData = new FormData();

  const result = getJsonFromFormData({
    name: "user",
    decoder: User,
    formData,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("Missing user");
});

test("fails if value isnt string", ({ expect }) => {
  const formData = new FormData();

  formData.set("user", new Blob());

  const result = getJsonFromFormData({
    name: "user",
    decoder: User,
    formData,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("'user' is wrong type");
});

test("fails if value isnt valid JSON string", ({ expect }) => {
  const formData = new FormData();

  formData.set("user", "[invalid");

  const result = getJsonFromFormData({
    name: "user",
    decoder: User,
    formData,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("Invalid json");
});

test("returns JSON if successful", ({ expect }) => {
  const formData = new FormData();

  formData.set("user", '{"username": "username"}');

  const result = getJsonFromFormData({
    name: "user",
    decoder: User,
    formData,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual({ username: "username" });
});
