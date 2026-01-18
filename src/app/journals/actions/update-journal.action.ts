"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync } from "purify-ts";
import { Maybe } from "purify-ts/Maybe";

import { getJsonFromFormData } from "@/lib/form-data/get-json-from-form-data";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { logger } from "@/lib/logger";
import { Journal, CreatedAtLocal, Level } from "../journal.types";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { Metadata } from "@/lib/types";
import { updateItem } from "@/lib/db/update-item";
import { deleteAllItems } from "@/lib/db/delete-all-items";
import { getJournalKey } from "../model/get-journal.model";
import { createItem } from "@/lib/db/create-item";
import { metadataToDatabaseDto } from "@/lib/codec/metadata-to-database-dto";
import { getImageFromFormData } from "@/lib/form-data/get-image-from-form-data";
import { getAudioFromFormData } from "@/lib/form-data/get-audio-from-form-data";
import {
  deleteJournalAssets,
  moveJournalAssetsIfTheyExist,
  uploadJournalAsset,
} from "../lib/journal-asset-utils.lib";

export const updateJournalAction = async (
  formData: FormData,
): Promise<void> => {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: 'server-action' }),
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

    const imageMaybe = getImageFromFormData({
      formData,
      name: "image",
    }).toMaybe();

    const audioMaybe = getAudioFromFormData({
      formData,
      name: "audio",
    }).toMaybe();

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
          ...metadataToDatabaseDto({ ...metadata, updatedAtIso: new Date() }),
          user,
          createdAtLocal,
          content,
          energyLevel,
          moodLevel,
          healthLevel,
          creativityLevel,
          relationshipsLevel,
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
          .chain(async (createdJournal) => {
            let chain = EitherAsync(async () => createdJournal);

            if (imageMaybe.isJust()) {
              const image = imageMaybe.extract();

              const caption = await liftEither(
                getStringFromFormData({ name: "imageCaption", formData }),
              );

              chain = chain
                .chain(() =>
                  uploadJournalAsset({
                    createdAtLocal,
                    assetType: "images",
                    file: image,
                    caption,
                    fallbackExtension: "jpg",
                  }).map(() => createdJournal),
                )
                .chain(() =>
                  deleteJournalAssets({
                    createdAtLocal: existingCreatedAtLocal,
                    assetType: "images",
                  }),
                )
                .map(() => createdJournal);
            } else {
              chain = chain.chain(() =>
                moveJournalAssetsIfTheyExist({
                  fromCreatedAtLocal: existingCreatedAtLocal,
                  toCreatedAtLocal: createdJournal.createdAtLocal,
                  assetType: "images",
                }).map(() => createdJournal),
              );
            }

            if (audioMaybe.isJust()) {
              const audio = audioMaybe.extract();
              const caption = Maybe.fromNullable(formData.get("audioCaption"))
                .chain((value) =>
                  typeof value === "string"
                    ? Maybe.of(value.trim())
                    : Maybe.empty(),
                )
                .filter((value) => value.length > 0)
                .orDefault(audio.name);

              chain = chain
                .chain(() =>
                  uploadJournalAsset({
                    createdAtLocal,
                    assetType: "audios",
                    file: audio,
                    caption,
                    fallbackExtension: "m4a",
                  }).map(() => createdJournal),
                )
                .chain(() =>
                  deleteJournalAssets({
                    createdAtLocal: existingCreatedAtLocal,
                    assetType: "audios",
                  }),
                )
                .map(() => createdJournal);
            } else {
              chain = chain.chain(() =>
                moveJournalAssetsIfTheyExist({
                  fromCreatedAtLocal: existingCreatedAtLocal,
                  toCreatedAtLocal: createdJournal.createdAtLocal,
                  assetType: "audios",
                }).map(() => createdJournal),
              );
            }

            return chain;
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
        ...metadataToDatabaseDto({ ...metadata, updatedAtIso: new Date() }),
        user,
        createdAtLocal,
        content,
        energyLevel,
        moodLevel,
        healthLevel,
        creativityLevel,
        relationshipsLevel,
      }),
    );

    logger.debug({ updatedJournal: journal });

    return fromPromise(
      updateItem({
        getKeyFn: (item) => getJournalKey({ createdAtLocal, user: item.user }),
        item: journal,
      })
        .chain(async (updatedJournal) => {
          let chain = EitherAsync(async () => updatedJournal);

          if (imageMaybe.isJust()) {
            const image = imageMaybe.extract();

            const caption = await liftEither(
              getStringFromFormData({ name: "imageCaption", formData }),
            );

            chain = chain.chain(() =>
              uploadJournalAsset({
                createdAtLocal,
                assetType: "images",
                file: image,
                caption,
                fallbackExtension: "jpg",
              }).map(() => updatedJournal),
            );
          }

          if (audioMaybe.isJust()) {
            const audio = audioMaybe.extract();
            const caption = Maybe.fromNullable(formData.get("audioCaption"))
              .chain((value) =>
                typeof value === "string" ? Maybe.of(value.trim()) : Maybe.empty(),
              )
              .filter((value) => value.length > 0)
              .orDefault(audio.name);

            chain = chain.chain(() =>
              uploadJournalAsset({
                createdAtLocal,
                assetType: "audios",
                file: audio,
                caption,
                fallbackExtension: "m4a",
              }).map(() => updatedJournal),
            );
          }

          return chain;
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
    logger.error(error);
  });

  if (response.isRight()) {
    redirect(
      `/journals/${response.extract().createdAtLocal}`,
      RedirectType.push,
    );
  }
};
