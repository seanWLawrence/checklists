"use server";

import { revalidatePath } from "next/cache";
import { EitherAsync } from "purify-ts";
import { Codec, array, optional, string } from "purify-ts/Codec";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { isAdminUsername } from "@/lib/auth/is-admin-username";
import { createApiToken } from "@/lib/auth/api-token/create-api-token";
import { ApiTokenScope } from "@/lib/auth/api-token/api-token.types";

export type CreateApiTokenActionResult =
  | {
      ok: true;
      token: string;
      id: string;
      createdAtIso: string;
      expiresAtIso: string;
    }
  | { ok: false; error: string };

const CreateApiTokenFormDataPayload = Codec.interface({
  name: string,
  scopes: array(ApiTokenScope),
  expiresAtIso: optional(string),
});

export const createApiTokenAction = async (
  _prevState: CreateApiTokenActionResult,
  formData: FormData,
  {
    validateUserLoggedInFn = validateUserLoggedIn,
    createApiTokenFn = createApiToken,
  }: {
    validateUserLoggedInFn?: typeof validateUserLoggedIn;
    createApiTokenFn?: typeof createApiToken;
  } = {},
): Promise<CreateApiTokenActionResult> => {
  const result = await EitherAsync(
    async ({ fromPromise, liftEither, throwE }) => {
      const user = await fromPromise(
        validateUserLoggedInFn({ variant: "server-action" }),
      );

      if (!isAdminUsername(user.username)) {
        return throwE("Not authorized");
      }

      const payload = await liftEither(
        CreateApiTokenFormDataPayload.decode({
          name: formData.get("name"),
          scopes: formData.getAll("scopes"),
          expiresAtIso: formData.get("expiresAtIso") ?? undefined,
        }),
      );
      const name = payload.name.trim();

      if (name === "") {
        return throwE("Token name is required");
      }

      if (payload.scopes.length === 0) {
        return throwE("Select at least one scope");
      }

      const expiresAtIso =
        payload.expiresAtIso && payload.expiresAtIso.trim() !== ""
          ? payload.expiresAtIso
          : undefined;

      return fromPromise(
        createApiTokenFn({
          user,
          name,
          scopes: payload.scopes,
          expiresAtIso,
        }),
      );
    },
  ).run();

  if (result.isRight()) {
    revalidatePath("/admin/api-tokens");

    return {
      ok: true,
      ...result.extract(),
    };
  }

  return {
    ok: false,
    error: String(result.extract()),
  };
};
