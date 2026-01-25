"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync } from "purify-ts";

import { getJsonFromFormData } from "@/lib/form-data/get-json-from-form-data";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { logger } from "@/lib/logger";
import { Journal, CreatedAtLocal, Level } from "../journal.types";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { updateItem } from "@/lib/db/update-item";
import { deleteAllItems } from "@/lib/db/delete-all-items";
import { getJournalKey } from "../model/get-journal.model";
import { createItem } from "@/lib/db/create-item";
import { metadataToDatabaseDto } from "@/lib/codec/metadata-to-database-dto";
import { getFilesFromFormData } from "@/lib/form-data/get-files-from-form-data";
import { getAllTranscriptionContents } from "../lib/get-all-transcription-contents";
import { putJournalAssets } from "../lib/put-journal-assets";

export const updateJournalAction = async (
  formData: FormData,
): Promise<void> => {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
    );

    const existingJournal = await liftEither(
      getJsonFromFormData({ name: "journal", formData, decoder: Journal }),
    );

    const existingCreatedAtLocal = await liftEither(
      getStringFromFormData({ name: "existingCreatedAtLocal", formData }).chain(
        CreatedAtLocal.decode,
      ),
    );

    const createdAtLocal = await liftEither(
      getStringFromFormData({ name: "createdAtLocal", formData }).chain(
        CreatedAtLocal.decode,
      ),
    );

    let content = await liftEither(
      getStringFromFormData({ name: "content", formData }),
    );

    const energyLevel = await liftEither(
      getStringFromFormData({ name: "energyLevel", formData })
        .map(Number)
        .chain(Level.decode),
    );

    const moodLevel = await liftEither(
      getStringFromFormData({ name: "moodLevel", formData })
        .map(Number)
        .chain(Level.decode),
    );

    const healthLevel = await liftEither(
      getStringFromFormData({ name: "healthLevel", formData })
        .map(Number)
        .chain(Level.decode),
    );

    const creativityLevel = await liftEither(
      getStringFromFormData({ name: "creativityLevel", formData })
        .map(Number)
        .chain(Level.decode),
    );

    const relationshipsLevel = await liftEither(
      getStringFromFormData({ name: "relationshipsLevel", formData })
        .map(Number)
        .chain(Level.decode),
    );

    const imageFiles = await liftEither(
      getFilesFromFormData({
        formData,
        name: "images",
      }),
    );

    const audioFiles = await liftEither(
      getFilesFromFormData({
        formData,
        name: "audios",
      }),
    );

    const dateChanged = createdAtLocal !== existingCreatedAtLocal;

    const transcriptionContents = await fromPromise(
      getAllTranscriptionContents({ formData, audioFiles }),
    );

    if (transcriptionContents.length > 0) {
      content = content.trim() + `\n\n${transcriptionContents}`;
    }

    const { audioAssets, imageAssets } = await fromPromise(
      putJournalAssets({
        formData,
        audioFiles,
        imageFiles,
      }),
    );

    if (dateChanged) {
      logger.debug("Date was changed, deleting existing journal");

      await fromPromise(
        deleteAllItems({
          keys: [
            getJournalKey({ user, createdAtLocal: existingCreatedAtLocal }),
          ],
        }),
      );

      logger.debug("Deleted existing journal");

      const journal = await liftEither(
        Journal.decode({
          ...metadataToDatabaseDto({
            ...existingJournal,
            updatedAtIso: new Date(),
          }),
          user,
          createdAtLocal,
          content,
          energyLevel,
          moodLevel,
          healthLevel,
          creativityLevel,
          relationshipsLevel,
          imageAssets: [
            ...(existingJournal?.imageAssets ?? []),
            ...imageAssets,
          ],
          audioAssets: [
            ...(existingJournal?.audioAssets ?? []),
            ...audioAssets,
          ],
        }),
      );

      logger.debug("Creating new journal with the new date");

      logger.debug({ newJournal: journal });

      return fromPromise(
        createItem({
          getKeyFn: (item) =>
            getJournalKey({ createdAtLocal, user: item.user }),
          item: journal,
        })
          .ifRight((x) => {
            const dateId = x.createdAtLocal;
            logger.info(`Successfully updated journal with date '${dateId}'`);
            revalidatePath("/journals");
            revalidatePath(`/journals/${dateId}`);
            revalidatePath(`/journals/${dateId}/edit`);
          })
          .ifLeft(async (e) => {
            const createdAtLocal = await liftEither(
              getStringFromFormData({ name: "createdAtLocal", formData }).chain(
                CreatedAtLocal.decode,
              ),
            );

            logger.error(
              `Failed to update journal with date '${createdAtLocal}')`,
            );
            logger.error(e);
          }),
      );
    }

    logger.debug("Date was not changed, updating existing journal");

    const journal = await liftEither(
      Journal.decode({
        ...metadataToDatabaseDto({
          ...existingJournal,
          updatedAtIso: new Date(),
        }),
        user,
        createdAtLocal,
        content,
        energyLevel,
        moodLevel,
        healthLevel,
        creativityLevel,
        relationshipsLevel,
        imageAssets: [...(existingJournal?.imageAssets ?? []), ...imageAssets],
        audioAssets: [...(existingJournal?.audioAssets ?? []), ...audioAssets],
      }),
    );

    logger.debug({ updatedJournal: journal });

    return fromPromise(
      updateItem({
        getKeyFn: (item) => getJournalKey({ createdAtLocal, user: item.user }),
        item: journal,
      })
        .ifRight((x) => {
          const dateId = x.createdAtLocal;
          logger.info(`Successfully updated journal with date '${dateId}'`);
          revalidatePath("/journals");
          revalidatePath(`/journals/${dateId}`);
          revalidatePath(`/journals/${dateId}/edit`);
        })
        .ifLeft(async (e) => {
          const createdAtLocal = await liftEither(
            getStringFromFormData({ name: "createdAtLocal", formData }).chain(
              CreatedAtLocal.decode,
            ),
          );

          logger.error(
            `Failed to update journal with date '${createdAtLocal}')`,
          );
          logger.error(e);
        }),
    );
  }).ifLeft((error) => {
    logger.error("Failed to update journal");
    logger.error(error);
  });

  if (response.isRight()) {
    redirect(
      `/journals/${response.extract().createdAtLocal}`,
      RedirectType.push,
    );
  }
};
