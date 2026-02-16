"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getJsonFromFormData } from "@/lib/form-data/get-json-from-form-data";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { logger } from "@/lib/logger";
import { Journal, CreatedAtLocal, Level, JournalAsset } from "../journal.types";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { updateItem } from "@/lib/db/update-item";
import { deleteAllItems } from "@/lib/db/delete-all-items";
import { getJournalKey } from "../model/get-journal.model";
import { createItem } from "@/lib/db/create-item";
import { metadataToDatabaseDto } from "@/lib/codec/metadata-to-database-dto";
import { array } from "purify-ts/Codec";
import { Metadata } from "@/lib/types";
import { upsertJournalEmbedding } from "../lib/upsert-journal-embedding.lib";
import { getJournalHabitsFromFormData } from "../lib/journal-habits";
import { getJournalAiAnalysis } from "../lib/get-journal-ai-analysis.lib";

export const updateJournalAction = async (
  formData: FormData,
): Promise<void> => {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
    );

    const metadata = await liftEither(
      getJsonFromFormData({ name: "metadata", formData, decoder: Metadata }),
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

    const content = await liftEither(
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

    const assets = await liftEither(
      getJsonFromFormData({
        formData,
        name: "assets",
        decoder: array(JournalAsset),
      }),
    );

    const habits = getJournalHabitsFromFormData({ formData });

    const analysis = await getJournalAiAnalysis({ content, habits });

    const dateChanged = createdAtLocal !== existingCreatedAtLocal;

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
            ...metadata,
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
          assets,
          ...analysis,
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
          ...metadata,
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
        assets,
        ...analysis,
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
    await upsertJournalEmbedding({ journal: response.extract() });
    redirect(
      `/journals/${response.extract().createdAtLocal}`,
      RedirectType.push,
    );
  }
};
