"use server";

import { revalidatePath } from "next/cache";
import { EitherAsync } from "purify-ts";

import { logger } from "@/lib/logger";
import { UUID } from "@/lib/types";
import { getChecklistV2Key } from "../model/get-checklist-v2.model";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { deleteAllItems } from "@/lib/db/delete-all-items";

export const deleteChecklistV2Action = async (id: UUID): Promise<void> => {
  await EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    return fromPromise(
      deleteAllItems({
        keys: [
          getChecklistV2Key({
            id,
            user,
          }),
        ],
      })
        .ifRight(() => {
          logger.info(`Successfully deleted checklist with ID '${id}'`);
          revalidatePath("/checklists");
          revalidatePath(`/checklists/${id}`);
          revalidatePath(`/checklists/${id}/edit`);
        })
        .ifLeft((e) => {
          logger.error(`Failed to delete checklist with ID '${id}'`);
          logger.error(e);
        }),
    );
  });
};
