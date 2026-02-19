"use server";

import { revalidatePath } from "next/cache";
import { EitherAsync } from "purify-ts";
import { Codec } from "purify-ts/Codec";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { isAdminUsername } from "@/lib/auth/is-admin-username";
import { revokeApiToken } from "@/lib/auth/api-token/revoke-api-token";
import { UUID } from "@/lib/types";

const RevokeApiTokenFormDataPayload = Codec.interface({
  id: UUID,
});

export const revokeApiTokenAction = async (
  formData: FormData,
): Promise<void> => {
  const result = await EitherAsync(async ({ fromPromise, liftEither, throwE }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
    );

    if (!isAdminUsername(user.username)) {
      return throwE("Not authorized");
    }

    const payload = await liftEither(
      RevokeApiTokenFormDataPayload.decode({
        id: formData.get("id"),
      }),
    );

    await fromPromise(revokeApiToken({ user, id: payload.id }));
  }).run();

  if (result.isLeft()) {
    throw new Error(String(result.extract()));
  }

  revalidatePath("/admin/api-tokens");
};
