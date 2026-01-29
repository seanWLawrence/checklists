"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync } from "purify-ts";

import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { logger } from "@/lib/logger";
import { CreatedAtLocal } from "../journal.types";
import { getJournal, getJournalKey } from "../model/get-journal.model";
import { deleteAllItems } from "@/lib/db/delete-all-items";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { deleteObject } from "@/lib/aws/s3/delete-object";

export const deleteJournalAction = async (
  formData: FormData,
): Promise<void> => {
  const response = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
    );

    const createdAtLocal = await liftEither(
      getStringFromFormData({ name: "createdAtLocal", formData }).chain(
        CreatedAtLocal.decode,
      ),
    );

    const journal = await fromPromise(getJournal(createdAtLocal));

    return fromPromise(
      deleteAllItems({
        keys: [
          getJournalKey({
            createdAtLocal,
            user,
          }),
        ],
      })
        .chain(() => {
          const allAssetFilenames =
            journal.assets?.map((asset) => asset.filename) ?? [];

          return EitherAsync.all(
            allAssetFilenames.map((filename) => deleteObject({ filename })),
          );
        })
        .ifRight(() => {
          const dateId = createdAtLocal;
          logger.info(`Successfully deleted journal with ID '${dateId}'`);
          revalidatePath("/journals");
          revalidatePath(`/journals/${dateId}`);
          revalidatePath(`/journals/${dateId}/edit`);
        })
        .ifLeft((e) => {
          logger.error(
            `Failed to delete checklist with date '${createdAtLocal}'`,
          );
          logger.error(e);
        }),
    );
  });

  if (response.isRight()) {
    redirect("/journals", RedirectType.push);
  }
};
