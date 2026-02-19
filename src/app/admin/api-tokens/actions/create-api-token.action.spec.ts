import { test, vi } from "vitest";
import { EitherAsync } from "purify-ts";
import { Right } from "purify-ts/Either";

vi.mock("@/lib/auth/is-admin-username", () => ({
  isAdminUsername: vi.fn(() => true),
}));

import { createApiTokenAction } from "./create-api-token.action";

const makeBaseFormData = () => {
  const formData = new FormData();
  formData.set("name", "agent token");
  return formData;
};

test("createApiTokenAction requires at least one scope", async ({ expect }) => {
  const formData = makeBaseFormData();
  const validateUserLoggedInFn = vi.fn().mockReturnValue(
    EitherAsync(async ({ liftEither }) =>
      liftEither(Right({ username: "sean" })),
    ),
  );
  const createApiTokenFn = vi.fn();

  const result = await createApiTokenAction(
    { ok: false, error: "" },
    formData,
    { validateUserLoggedInFn, createApiTokenFn },
  );

  expect(result).toEqual({
    ok: false,
    error: "Select at least one scope",
  });
  expect(createApiTokenFn).not.toHaveBeenCalled();
});

test("createApiTokenAction requires non-empty token name", async ({ expect }) => {
  const formData = makeBaseFormData();
  formData.set("name", " ");
  formData.append("scopes", "notes:create");

  const validateUserLoggedInFn = vi.fn().mockReturnValue(
    EitherAsync(async ({ liftEither }) =>
      liftEither(Right({ username: "sean" })),
    ),
  );
  const createApiTokenFn = vi.fn();

  const result = await createApiTokenAction(
    { ok: false, error: "" },
    formData,
    { validateUserLoggedInFn, createApiTokenFn },
  );

  expect(result).toEqual({
    ok: false,
    error: "Token name is required",
  });
  expect(createApiTokenFn).not.toHaveBeenCalled();
});
