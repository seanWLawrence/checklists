"use server";

import { revalidatePath } from "next/cache";
import { EitherAsync } from "purify-ts";

import { logger } from "@/lib/logger";
import { UUID } from "@/lib/types";
import { getNoteKey } from "../model/get-note.model";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { deleteAllItems } from "@/lib/db/delete-all-items";

export const deleteNoteAction = async (id: UUID): Promise<void> => {
  await EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: 'server-action' }),
    );

    return fromPromise(
      deleteAllItems({
        keys: [
          getNoteKey({
            id,
            user,
          }),
        ],
      })
        .ifRight(() => {
          logger.info(`Successfully deleted note with ID '${id}'`);
          revalidatePath("/notes");
          revalidatePath(`/notes/${id}`);
          revalidatePath(`/notes/${id}/edit`);
        })
        .ifLeft((e) => {
          logger.error(`Failed to delete note with ID '${id}'`);
          logger.error(e);
        }),
    );
  });
};
