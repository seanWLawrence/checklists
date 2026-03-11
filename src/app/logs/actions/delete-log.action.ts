"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync } from "purify-ts";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { logger } from "@/lib/logger";
import { deleteAllItems } from "@/lib/redis/delete-all-items";
import { UUID } from "@/lib/types";
import { getLogKey } from "../model/get-log-key";

export const deleteLogAction = async (id: UUID): Promise<void> => {
  const response = await EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
    );

    return fromPromise(
      deleteAllItems({
        keys: [
          getLogKey({
            id,
            user,
          }),
        ],
      })
        .ifRight(() => {
          logger.info(`Successfully deleted log with ID '${id}'`);
          revalidatePath("/logs");
          revalidatePath(`/logs/${id}`);
          revalidatePath(`/logs/${id}/edit`);
        })
        .ifLeft((error) => {
          logger.error(`Failed to delete log with ID '${id}'`);
          logger.error(error);
        }),
    );
  });

  if (response.isRight()) {
    redirect("/logs", RedirectType.push);
  }
};
