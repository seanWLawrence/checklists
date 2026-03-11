"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync } from "purify-ts";
import { array } from "purify-ts/Codec";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getJsonFromFormData } from "@/lib/form-data/get-json-from-form-data";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { logger } from "@/lib/logger";
import { Metadata } from "@/lib/types";
import { updateItem } from "@/lib/redis/update-item";
import { Log, LogSection } from "../log.types";
import { getLogKey } from "../model/get-log-key";

export const updateLogAction = async (formData: FormData): Promise<void> => {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
    );

    const metadata = await liftEither(
      getJsonFromFormData({ name: "metadata", formData, decoder: Metadata }),
    );

    const name = await liftEither(
      getStringFromFormData({ name: "name", formData }),
    );

    const sections = await liftEither(
      getJsonFromFormData({
        name: "sections",
        formData,
        decoder: array(LogSection),
      }),
    );

    const log = await liftEither(
      Log.decode({
        ...metadata,
        user,
        createdAtIso: metadata.createdAtIso.toISOString(),
        updatedAtIso: new Date().toISOString(),
        name,
        sections,
      }),
    );

    return fromPromise(
      updateItem({
        getKeyFn: (item) => getLogKey({ user: item.user, id: item.id }),
        item: log,
      })
        .ifRight((item) => {
          logger.info(`Successfully updated log '${item.id}' ('${item.name}')`);
          revalidatePath("/logs");
          revalidatePath(`/logs/${item.id}`);
          revalidatePath(`/logs/${item.id}/edit`);
        })
        .ifLeft((error) => {
          logger.error("Failed to update log");
          logger.error(error);
        }),
    );
  });

  if (response.isRight()) {
    redirect(`/logs/${response.extract().id}`, RedirectType.push);
  }

  if (response.isLeft()) {
    logger.error("Failed to update log");
    logger.error(response.extract());
  }
};
