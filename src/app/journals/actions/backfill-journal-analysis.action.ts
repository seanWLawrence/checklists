"use server";

import { redirect } from "next/navigation";
import { EitherAsync } from "purify-ts/EitherAsync";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { isAdminUsername } from "@/lib/auth/is-admin-username";
import { scan } from "@/lib/db/scan";
import { getAllItems } from "@/lib/db/get-all-items";
import { updateItem } from "@/lib/db/update-item";
import { logger } from "@/lib/logger";
import { Journal } from "../journal.types";
import { getAllJournalsScanKey } from "../model/get-all-created-at-locals.model";
import { getJournalKey } from "../model/get-journal.model";
import { getJournalAiAnalysis } from "../lib/get-journal-ai-analysis.lib";
import { EMPTY_JOURNAL_HABITS } from "../lib/journal-habits";

const getTrimmedString = (value: FormDataEntryValue | null): string => {
  return typeof value === "string" ? value.trim() : "";
};

export const backfillJournalAnalysisAction = async (
  formData: FormData,
): Promise<void> => {
  const redirectToRaw = getTrimmedString(formData.get("redirectTo"));
  const redirectTo =
    redirectToRaw.startsWith("/") && redirectToRaw.length > 1
      ? redirectToRaw
      : "/journals/vectors";
  const limit = getTrimmedString(formData.get("limit"));
  const nextToken = getTrimmedString(formData.get("nextToken"));

  const result = await EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
    );

    if (!isAdminUsername(user.username)) {
      throw new Error("Not authorized to backfill journal analysis");
    }

    const keys = await fromPromise(
      scan({
        key: getAllJournalsScanKey({ user }),
      }),
    );

    const journals = await fromPromise(getAllItems({ keys, decoder: Journal }));

    let successCount = 0;
    let failedCount = 0;

    const sortedJournals = [...journals].sort((a, b) => {
      return a.createdAtLocal.localeCompare(b.createdAtLocal);
    });

    for (const journal of sortedJournals) {
      const analysis = await getJournalAiAnalysis({
        content: journal.content ?? "",
        habits: journal.habits ?? EMPTY_JOURNAL_HABITS,
      });

      const updated = {
        ...journal,
        ...analysis,
        updatedAtIso: new Date(),
      };

      const updateResult = await updateItem({
        getKeyFn: (item) =>
          getJournalKey({ createdAtLocal: item.createdAtLocal, user: item.user }),
        item: updated,
      });

      if (updateResult.isRight()) {
        successCount += 1;
      } else {
        failedCount += 1;
        logger.error(
          `Failed to update journal analysis for '${journal.createdAtLocal}'`,
          updateResult.extract(),
        );
      }
    }

    return {
      totalCount: journals.length,
      successCount,
      failedCount,
    };
  });

  const params = new URLSearchParams();

  if (limit !== "") {
    params.set("limit", limit);
  }

  if (nextToken !== "") {
    params.set("nextToken", nextToken);
  }

  if (result.isRight()) {
    const { totalCount, successCount, failedCount } = result.extract();
    logger.info(
      `Journal analysis backfill completed (total=${totalCount}, success=${successCount}, failed=${failedCount})`,
    );

    params.set("analysisBackfillTotal", String(totalCount));
    params.set("analysisBackfillSuccess", String(successCount));
    params.set("analysisBackfillFailed", String(failedCount));
  } else {
    logger.error("Failed to backfill journal analysis", result.extract());
    params.set("analysisBackfillError", "1");
  }

  redirect(`${redirectTo}${params.size > 0 ? `?${params.toString()}` : ""}`);
};
