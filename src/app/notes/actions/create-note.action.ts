"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync, intersect } from "purify-ts";

import { createItem } from "@/lib/db/create-item";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { logger } from "@/lib/logger";
import { Metadata } from "@/lib/types";
import { metadata } from "@/lib/db/metadata.factory";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { NoteBase } from "../types";
import { getNoteKey } from "../model/get-note.model";

export const createNoteAction = async (formData: FormData): Promise<void> => {
  const response = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    const name = await liftEither(
      getStringFromFormData({ name: "name", formData }),
    );

    const content = await liftEither(
      getStringFromFormData({ name: "content", formData }),
    );

    const noteBase = await liftEither(
      intersect(NoteBase, Metadata).decode({
        name,
        content,
        ...metadata(user),
      }),
    );

    return fromPromise(
      createItem({
        getKeyFn: (item) => getNoteKey({ id: item.id, user: item.user }),
        item: noteBase,
      })
        .ifLeft((e) => {
          logger.error(`Failed to create note '${noteBase.name}'`);
          logger.error(e);
        })
        .ifRight((note) => {
          logger.info(
            `Successfully created note with ID '${note.id}' ('${note.name}')`,
          );
          revalidatePath("/notes");
        }),
    );
  });

  if (response.isRight()) {
    redirect(`/notes/${response.extract().id}`, RedirectType.push);
  }
};
