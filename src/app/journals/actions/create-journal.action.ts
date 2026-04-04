"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync } from "purify-ts";

import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { logger } from "@/lib/logger";
import {
  CreatedAtLocal,
  Journal,
  JournalAsset,
} from "../journal.types";
import { validateDateIsUnique } from "../lib/validate-date-is-unique.lib";
import { createItem } from "@/lib/redis/create-item";
import { getJournalKey } from "../model/get-journal.model";
import { metadata } from "@/lib/redis/metadata.factory";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getJsonFromFormData } from "@/lib/form-data/get-json-from-form-data";
import { array } from "purify-ts/Codec";
import { upsertJournalEmbedding } from "../lib/upsert-journal-embedding.lib";
import { getJournalCheckInFromFormData } from "../lib/journal-check-in";
import { getJournalAiAnalysis } from "../lib/get-journal-ai-analysis.lib";

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
    const transcriptionRaw = await liftEither(
      getStringFromFormData({ name: "transcriptionRaw", formData }),
    );

    const assets = await liftEither(
      getJsonFromFormData({
        name: "assets",
        formData,
        decoder: array(JournalAsset),
      }),
    );

    const checkIn = await liftEither(getJournalCheckInFromFormData({ formData }));
    const analysis = await getJournalAiAnalysis({ content });

    const journal = await liftEither(
      Journal.decode({
        ...metadata(user),
        schemaVersion: 2,
        createdAtLocal,
        entry: {
          content,
          transcriptionRaw,
          assets: assets.length > 0 ? assets : undefined,
        },
        checkIn,
        analysis,
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
    await upsertJournalEmbedding({ journal: response.extract() });
    redirect(
      `/journals/${response.extract().createdAtLocal}`,
      RedirectType.push,
    );
  }
};
