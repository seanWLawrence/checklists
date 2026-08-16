"use server";

import { revalidatePath } from "next/cache";
import { EitherAsync } from "purify-ts";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { logger } from "@/lib/logger";
import { updateItem } from "@/lib/redis/update-item";
import { UUID } from "@/lib/types";
import { ChecklistV2, ChecklistViewMode } from "../checklist-v2.types";
import { getChecklistV2, getChecklistV2Key } from "../model/get-checklist-v2.model";

export const updateChecklistViewModeAction = async ({
  checklistId,
  viewMode,
}: {
  checklistId: string;
  viewMode: ChecklistViewMode;
}): Promise<void> => {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
    );
    const id = await liftEither(UUID.decode(checklistId));
    const nextViewMode = await liftEither(ChecklistViewMode.decode(viewMode));
    const checklist = await fromPromise(getChecklistV2(id));

    const updatedChecklist = await liftEither(
      ChecklistV2.decode({
        ...checklist,
        viewMode: nextViewMode,
        createdAtIso: checklist.createdAtIso.toISOString(),
        updatedAtIso: new Date().toISOString(),
      }),
    );

    return fromPromise(
      updateItem({
        getKeyFn: (item) => getChecklistV2Key({ id: item.id, user }),
        item: updatedChecklist,
      }),
    );
  });

  if (response.isLeft()) {
    logger.error("Failed to update checklist view mode");
    logger.error(response.extract());
    return;
  }

  revalidatePath(`/checklists/${checklistId}`);
};
