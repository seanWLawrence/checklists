"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync } from "purify-ts/EitherAsync";

import { logger } from "@/lib/logger";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { getSingleItem } from "@/lib/db/get-single-item";
import { updateItem } from "@/lib/db/update-item";
import { CreatedAtLocal, Journal } from "../journal.types";
import { getJournalKey } from "../model/get-journal.model";
import { getJournalHabitsFromFormData } from "../lib/journal-habits";
import { getJournalAiAnalysis } from "../lib/get-journal-ai-analysis.lib";

export const regenerateJournalAnalysisAction = async (
  formData: FormData,
): Promise<void> => {
  const result = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
    );

    const createdAtLocal = await liftEither(
      getStringFromFormData({ name: "createdAtLocal", formData }).chain(
        CreatedAtLocal.decode,
      ),
    );

    const existing = await fromPromise(
      getSingleItem({
        key: getJournalKey({ user, createdAtLocal }),
        decoder: Journal,
      }),
    );

    const habits = getJournalHabitsFromFormData({ formData });
    const analysis = await getJournalAiAnalysis({
      content: existing.content,
      habits,
    });

    const updated = await liftEither(
      Journal.decode({
        ...existing,
        ...analysis,
        updatedAtIso: new Date(),
      }),
    );

    return fromPromise(
      updateItem({
        getKeyFn: (item) =>
          getJournalKey({ createdAtLocal: item.createdAtLocal, user: item.user }),
        item: updated,
      })
        .ifRight((journal) => {
          logger.info(
            `Successfully regenerated analysis for '${journal.createdAtLocal}'`,
          );

          revalidatePath("/journals");
          revalidatePath(`/journals/${journal.createdAtLocal}`);
          revalidatePath(`/journals/${journal.createdAtLocal}/edit`);
        })
        .ifLeft((error) => {
          logger.error(
            `Failed to regenerate journal analysis for '${createdAtLocal}'`,
            error,
          );
        }),
    );
  }).run();

  if (result.isRight()) {
    const journal = result.extract();
    redirect(`/journals/${journal.createdAtLocal}`, RedirectType.push);
  }
};
