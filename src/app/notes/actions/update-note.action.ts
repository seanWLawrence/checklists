"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync } from "purify-ts";

import { getJsonFromFormData } from "@/lib/form-data/get-json-from-form-data";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { logger } from "@/lib/logger";
import { Note } from "../types";
import { getNoteKey } from "../model/get-note.model";
import { Metadata } from "@/lib/types";
import { updateItem } from "@/lib/db/update-item";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";

export const updateNoteAction = async (formData: FormData): Promise<void> => {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: 'server-action' }),
    );

    const metadata = await liftEither(
      getJsonFromFormData({ name: "metadata", formData, decoder: Metadata }),
    );

    const name = await liftEither(
      getStringFromFormData({ name: "name", formData }),
    );

    const content = await liftEither(
      getStringFromFormData({ name: "content", formData }),
    );

    const note = await liftEither(
      Note.decode({
        ...metadata,
        user,
        createdAtIso: metadata.createdAtIso.toISOString(),
        updatedAtIso: new Date().toISOString(),
        name,
        content,
      }),
    );

    return fromPromise(
      updateItem({
        getKeyFn: (item) => getNoteKey({ id: item.id, user: item.user }),
        item: note,
      })
        .ifRight((x) => {
          logger.info(
            `Successfully updated note with ID '${x.id}' ('${x.name}')`,
          );
          revalidatePath("/notes");
          revalidatePath(`/notes/${x.id}`);
          revalidatePath(`/notes/${x.id}/edit`);
        })
        .ifLeft((e) => {
          logger.error(e);
        }),
    );
  });

  if (response.isRight()) {
    redirect(`/notes/${response.extract().id}`, RedirectType.push);
  }

  if (response.isLeft()) {
    logger.error("Failed to update note");
    logger.error(response.extract());
  }
};
