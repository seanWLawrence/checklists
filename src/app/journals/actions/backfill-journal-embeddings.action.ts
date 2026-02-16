"use server";

import { redirect } from "next/navigation";
import { EitherAsync } from "purify-ts/EitherAsync";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { scan } from "@/lib/db/scan";
import { getAllItems } from "@/lib/db/get-all-items";
import { logger } from "@/lib/logger";
import { Journal } from "../journal.types";
import { getAllJournalsScanKey } from "../model/get-all-created-at-locals.model";
import { upsertJournalEmbedding } from "../lib/upsert-journal-embedding.lib";
import { isAdminUsername } from "@/lib/auth/is-admin-username";

const getTrimmedString = (value: FormDataEntryValue | null): string => {
  return typeof value === "string" ? value.trim() : "";
};

export const backfillJournalEmbeddingsAction = async (
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
      throw new Error("Not authorized to backfill journal embeddings");
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
      const ok = await upsertJournalEmbedding({ journal });
      if (ok) {
        successCount += 1;
      } else {
        failedCount += 1;
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
      `Journal embedding backfill completed (total=${totalCount}, success=${successCount}, failed=${failedCount})`,
    );

    params.set("backfillTotal", String(totalCount));
    params.set("backfillSuccess", String(successCount));
    params.set("backfillFailed", String(failedCount));
  } else {
    logger.error("Failed to backfill journal embeddings", result.extract());
    params.set("backfillError", "1");
  }

  redirect(`${redirectTo}${params.size > 0 ? `?${params.toString()}` : ""}`);
};
