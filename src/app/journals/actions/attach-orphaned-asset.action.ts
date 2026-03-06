"use server";

import { revalidatePath } from "next/cache";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Left, Right } from "purify-ts/Either";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { logger } from "@/lib/logger";
import { getSingleItem } from "@/lib/redis/get-single-item";
import { updateItem } from "@/lib/redis/update-item";
import { metadataToDatabaseDto } from "@/lib/codec/metadata-to-database-dto";
import {
  CreatedAtLocal,
  Journal,
  JournalAsset,
  JournalAssetVariant,
} from "../journal.types";
import { getJournalKey } from "../model/get-journal.model";

export const attachOrphanedAssetAction = async ({
  formData,
}: {
  formData: FormData;
}): Promise<void> => {
  await EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
    );
    const filename = await liftEither(
      getStringFromFormData({ name: "filename", formData }).chain((value) =>
        value.trim().length > 0
          ? Right(value.trim())
          : Left("Filename must be a non-empty string"),
      ),
    );
    const variant = await liftEither(
      getStringFromFormData({ name: "variant", formData }).chain(
        JournalAssetVariant.decode,
      ),
    );
    const createdAtLocal = await liftEither(
      getStringFromFormData({ name: "createdAtLocal", formData })
        .map((value) => value.trim())
        .chain(CreatedAtLocal.decode),
    );
    const since = await liftEither(
      getStringFromFormData({ name: "since", formData }),
    );

    const journal = await fromPromise(
      getSingleItem({
        key: getJournalKey({ user, createdAtLocal }),
        decoder: Journal,
      }),
    );

    const hasExistingReference = (journal.assets ?? []).some(
      (asset) => asset.filename === filename,
    );

    if (!hasExistingReference) {
      const nextAsset = await liftEither(
        JournalAsset.decode({
          caption: filename,
          filename,
          variant,
        }),
      );
      const nextJournal = await liftEither(
        Journal.decode({
          ...metadataToDatabaseDto({
            ...journal,
            updatedAtIso: new Date(),
          }),
          assets: [...(journal.assets ?? []), nextAsset],
        }),
      );

      await fromPromise(
        updateItem({
          item: nextJournal,
          getKeyFn: (item) =>
            getJournalKey({
              user: item.user,
              createdAtLocal: item.createdAtLocal,
            }),
        }),
      );

      logger.info(
        `Attached orphaned asset '${filename}' to journal '${createdAtLocal}'`,
      );
    }

    revalidatePath("/journals");
    revalidatePath(`/journals/${createdAtLocal}`);
    revalidatePath(`/journals/${createdAtLocal}/edit`);
    revalidatePath(`/journals/assets/${since}`);
  }).ifLeft((error) => {
    logger.error("Failed to attach orphaned asset");
    logger.error(error);
  });
};
