"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync, intersect } from "purify-ts";

import { createItem } from "@/lib/db/create-item";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { logger } from "@/lib/logger";
import { ChecklistV2, ChecklistV2Base } from "../checklist-v2.types";
import { getChecklistV2Key } from "../model/get-checklist-v2.model";
import { Metadata } from "@/lib/types";
import { metadata } from "@/lib/db/metadata.factory";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";

export const createChecklistV2Action = async (
  formData: FormData,
): Promise<unknown | ChecklistV2> => {
  const response = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    const name = await liftEither(
      getStringFromFormData({ name: "name", formData }),
    );

    const content = await liftEither(
      getStringFromFormData({ name: "content", formData }),
    );

    const checklistBase = await liftEither(
      intersect(ChecklistV2Base, Metadata).decode({
        name,
        content,
        ...metadata(user),
      }),
    );

    return fromPromise(
      createItem({
        getKeyFn: (item) => getChecklistV2Key({ id: item.id, user: item.user }),
        item: checklistBase,
      })
        .ifLeft((e) => {
          logger.error(`Failed to create checklist '${checklistBase.name}'`);
          logger.error(e);
        })
        .ifRight((checklist) => {
          logger.info(
            `Successfully created checklist with ID '${checklist.id}' ('${checklist.name}')`,
          );
          revalidatePath("/checklists");
        }),
    );
  });

  if (response.isRight()) {
    redirect(`/checklists/${response.extract().id}`, RedirectType.push);
  }

  return response.toJSON();
};
