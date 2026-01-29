"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync, intersect } from "purify-ts";

import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { logger } from "@/lib/logger";
import {
  CreatedAtLocal,
  Level,
  JournalBase,
  JournalAsset,
} from "../journal.types";
import { validateDateIsUnique } from "../lib/validate-date-is-unique.lib";
import { createItem } from "@/lib/db/create-item";
import { getJournalKey } from "../model/get-journal.model";
import { Metadata } from "@/lib/types";
import { metadata } from "@/lib/db/metadata.factory";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getJsonFromFormData } from "@/lib/form-data/get-json-from-form-data";
import { array } from "purify-ts/Codec";

export const createJournalAction = async (
  formData: FormData,
): Promise<void> => {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
    );

    const createdAtLocal = await liftEither(
      getStringFromFormData({ name: "createdAtLocal", formData }).chain(
        CreatedAtLocal.decode,
      ),
    );

    await fromPromise(validateDateIsUnique(createdAtLocal));

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
        name: "assets",
        formData,
        decoder: array(JournalAsset),
      }),
    );

    const journal = await liftEither(
      intersect(JournalBase, Metadata).decode({
        ...metadata(user),
        content,
        createdAtLocal,
        moodLevel,
        energyLevel,
        healthLevel,
        creativityLevel,
        relationshipsLevel,
        assets,
      }),
    );

    return fromPromise(
      createItem({
        getKeyFn: (item) => getJournalKey({ createdAtLocal, user: item.user }),
        item: journal,
      })
        .ifLeft((e) => {
          logger.error(`Failed to create journal`);
          logger.error(e);
        })
        .ifRight((journal) => {
          logger.info(
            `Successfully created journal with date '${journal.createdAtLocal}'`,
          );
          revalidatePath("/journals");
        }),
    );
  });

  if (response.isRight()) {
    redirect(
      `/journals/${response.extract().createdAtLocal}`,
      RedirectType.push,
    );
  }
};
