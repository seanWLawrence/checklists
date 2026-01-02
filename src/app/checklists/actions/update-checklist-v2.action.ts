"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync } from "purify-ts";

import { getJsonFromFormData } from "@/lib/form-data/get-json-from-form-data";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { logger } from "@/lib/logger";
import {
  checklistV2TaskFormToContent,
  getIsCompletedFromFormData,
} from "../[id]/checklist-v2-task-form-to-content";
import { ChecklistV2, ChecklistV2Structured } from "../checklist-v2.types";
import { getChecklistV2Key } from "../model/get-checklist-v2.model";
import { Metadata } from "@/lib/types";
import { updateItem } from "@/lib/db/update-item";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";

export const updateChecklistV2Action = async (
  formData: FormData,
): Promise<void> => {
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
      getStringFromFormData({ name: "content", formData }).chainLeft(() => {
        return getJsonFromFormData({
          formData,
          name: "checklist",
          decoder: ChecklistV2Structured,
        }).map((checklist) => {
          return checklistV2TaskFormToContent({
            checklist,
            getIsCompleted: getIsCompletedFromFormData({ formData }),
          });
        });
      }),
    );

    const checklist = await liftEither(
      ChecklistV2.decode({
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
        getKeyFn: (item) => getChecklistV2Key({ id: item.id, user: item.user }),
        item: checklist,
      })
        .ifRight((x) => {
          logger.info(
            `Successfully updated checklist with ID '${x.id}' ('${x.name}')`,
          );
          revalidatePath("/checklists");
          revalidatePath(`/checklists/${x.id}`);
          revalidatePath(`/checklists/${x.id}/edit`);
        })
        .ifLeft((e) => {
          logger.error(e);
        }),
    );
  });

  if (response.isRight()) {
    redirect(`/checklists/${response.extract().id}`, RedirectType.push);
  }

  if (response.isLeft()) {
    logger.error("Failed to update checklist");
    logger.error(response.extract());
  }
};
