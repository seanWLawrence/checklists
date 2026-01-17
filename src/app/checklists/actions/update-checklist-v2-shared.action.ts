"use server";

import { EitherAsync } from "purify-ts";
import { revalidatePath } from "next/cache";

import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { getJsonFromFormData } from "@/lib/form-data/get-json-from-form-data";
import { constantTimeStringComparison } from "@/lib/auth/constant-time-string-comparison";
import { getSingleItem } from "@/lib/db/get-single-item";
import { updateItem } from "@/lib/db/update-item";
import { logger } from "@/lib/logger";
import { UUID } from "@/lib/types";
import { secureHashSha256 } from "@/lib/auth/secure-hash-sha256";
import {
  checklistV2TaskFormToContent,
  getIsCompletedFromFormData,
} from "../[id]/checklist-v2-task-form-to-content";
import { ChecklistV2, ChecklistV2Structured } from "../checklist-v2.types";
import { ChecklistShareAccess } from "../checklist-share.types";
import { getChecklistShareKey } from "../model/get-checklist-share-key";
import { getChecklistV2Key } from "../model/get-checklist-v2.model";

export const updateChecklistV2SharedAction = async (
  formData: FormData,
): Promise<void> => {
  const response = await EitherAsync(
    async ({ fromPromise, liftEither, throwE }) => {
      const token = await liftEither(
        getStringFromFormData({ name: "shareToken", formData }),
      );
      const checklistId = await liftEither(
        getStringFromFormData({ name: "checklistId", formData }).chain(
          UUID.decode,
        ),
      );

      const hashedToken = await liftEither(secureHashSha256(token));

      const shareAccess = await fromPromise(
        getSingleItem({
          key: getChecklistShareKey({ hash: hashedToken }),
          decoder: ChecklistShareAccess,
        }),
      );

      const hashesMatch = constantTimeStringComparison(
        hashedToken,
        shareAccess.hash,
      );

      if (!hashesMatch) {
        return throwE("Share token hash doesn't match");
      }

      if (shareAccess.expiresAtIso.getTime() <= Date.now()) {
        return throwE("Share link expired");
      }

      if (shareAccess.checklistId !== checklistId) {
        return throwE("Share link does not grant access to this checklist");
      }

      const checklist = await fromPromise(
        getSingleItem({
          key: getChecklistV2Key({
            id: shareAccess.checklistId,
            user: shareAccess.user,
          }),
          decoder: ChecklistV2,
        }),
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

      const updatedChecklist = await liftEither(
        ChecklistV2.decode({
          ...checklist,
          createdAtIso: checklist.createdAtIso.toISOString(),
          updatedAtIso: new Date().toISOString(),
          name,
          content,
        }),
      );

      return fromPromise(
        updateItem({
          getKeyFn: (item) =>
            getChecklistV2Key({
              id: item.id,
              user: item.user,
            }),
          item: updatedChecklist,
        })
          .ifRight((x) => {
            logger.info(
              `Successfully updated shared checklist with ID '${x.id}' ('${x.name}')`,
            );
            revalidatePath("/checklists");
            revalidatePath(`/checklists/${x.id}`);
          })
          .ifLeft((e) => {
            logger.error(e);
          }),
      );
    },
  );

  if (response.isLeft()) {
    logger.error("Failed to update shared checklist");
    logger.error(response.extract());
  }
};
