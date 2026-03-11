"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { EitherAsync, Maybe } from "purify-ts";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { getJsonFromFormData } from "@/lib/form-data/get-json-from-form-data";
import { logger } from "@/lib/logger";
import { createItem } from "@/lib/redis/create-item";
import { array } from "purify-ts/Codec";
import { Log, LogSection } from "../log.types";
import { getLogKey } from "../model/get-log-key";
import { metadata } from "@/lib/redis/metadata.factory";

export const createLogAction = async (formData: FormData): Promise<void> => {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
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

    const redirectToEdit = Maybe.fromNullable(formData.get("redirectToEdit"))
      .chain((value) => (typeof value === "string" ? Maybe.of(value) : Maybe.empty()))
      .map((value) => value === "true")
      .orDefault(false);

    const item = await fromPromise(
      createItem({
        item: { ...metadata(user), name, sections },
        getKeyFn: (createdItem) => getLogKey({ user, id: createdItem.id }),
      })
        .ifRight(() => {
          logger.info(`Successfully created log '${name}'`);
          revalidatePath("/logs");
        })
        .ifLeft((error) => {
          logger.error(`Failed to create log '${name}'`);
          logger.error(error);
        }),
    );

    return {
      item,
      redirectToEdit,
    };
  });

  if (response.isRight()) {
    const { item, redirectToEdit } = response.extract();
    const pathname = redirectToEdit ? `/logs/${item.id}/edit` : `/logs/${item.id}`;
    redirect(pathname, RedirectType.push);
  }
};
