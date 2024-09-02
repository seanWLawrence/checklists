"use server";
import { EitherAsync } from "purify-ts/EitherAsync";

import { revalidatePath } from "next/cache";
import { RedirectType, redirect } from "next/navigation";
import {
  create,
  deleteAll,
  getAllItemsKeys,
  getAllObjectsFromKeys,
  getObjectFromKey,
  update,
  getUserAsEither,
} from "@/lib/db.model";
import {
  ChecklistV2Base,
  ChecklistV2,
  ChecklistV2Structured,
} from "./checklist-v2.types";
import { Key, Metadata, UUID, User } from "@/lib/types";
import { logger } from "@/lib/logger";
import {
  checklistV2TaskFormToContent,
  getIsCompletedFromFormData,
} from "./[id]/checklist-v2-task-form-to-content";
import { getStringFromFormData, getJsonFromFormData } from "@/lib/form-data";

/**
 * Gets all checklist keys for a given user
 */
const getAllChecklistsV2ScanKey = ({ user }: { user: User }): Key =>
  `user#${user.username}#checklist-v2#*`;

/**
 * Gets a checklist key for a given user
 */
const getChecklistV2Key = ({ user, id }: { user: User; id: UUID }): Key =>
  `user#${user.username}#checklist-v2#${id}`;

/**
 * Create
 */

export const createChecklistV2Action = async (
  formData: FormData,
): Promise<unknown | ChecklistV2> => {
  const response = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const name = await liftEither(
      getStringFromFormData({ name: "name", formData }),
    );

    const content = await liftEither(
      getStringFromFormData({ name: "content", formData }),
    );

    const checklistBase = await liftEither(
      ChecklistV2Base.decode({ name, content }),
    );

    return fromPromise(
      create({
        key: (item) => getChecklistV2Key({ id: item.id, user: item.user }),
        item: checklistBase,
        decoder: ChecklistV2Base,
      })
        .ifLeft((e) => {
          logger.error(`Failed to create checklist '${checklistBase.name}'`);
          logger.error(e);
        })
        .ifRight((checklist) => {
          logger.info(
            `Successfully created checklist with ID '${checklist.id}' ('${checklist.name}')`,
          );
          revalidatePath("/checklists");
        }),
    );
  }).run();

  if (response.isRight()) {
    redirect(`/checklists/${response.extract().id}`, RedirectType.push);
  }

  return response.toJSON();
};

/**
 * Read
 */

export const getAllChecklistsV2 = (): EitherAsync<unknown, ChecklistV2[]> => {
  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(getUserAsEither());

    const { keys: validatedKeys } = await fromPromise(
      getAllItemsKeys({
        existingKeys: [],
        scanKey: getAllChecklistsV2ScanKey({ user }),
      }),
    );

    return await fromPromise(
      getAllObjectsFromKeys({ keys: validatedKeys, decoder: ChecklistV2 }),
    );
  })
    .ifRight(() => {
      logger.info(`Successfully loaded all checklists`);
      revalidatePath("/checklists");
    })
    .ifLeft((e) => {
      logger.error(`Failed to load all checklists`);
      logger.error(e);
    });
};

export const getChecklistV2 = (id: UUID): EitherAsync<unknown, ChecklistV2> => {
  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(getUserAsEither());
    const key = getChecklistV2Key({ id, user });

    return fromPromise(
      getObjectFromKey({ key, decoder: ChecklistV2, user }).run(),
    );
  })
    .ifRight((x) => {
      logger.info(
        `Successfully loaded checklist with ID '${x.id}' ('${x.name}')`,
      );
      revalidatePath(`/checklists/${x.id}`);
      revalidatePath(`/checklists/${x.id}/edit`);
    })
    .ifLeft((e) => {
      logger.error(`Failed to load checklist with ID '${id}'`);
      logger.error(e);
    });
};

/**
 * Update
 */

export const updateChecklistV2Action = async (
  formData: FormData,
): Promise<unknown | ChecklistV2> => {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const metadata = await liftEither(
      getJsonFromFormData({ name: "metadata", formData, decoder: Metadata }),
    );

    const name = await liftEither(
      getStringFromFormData({ name: "name", formData }),
    );

    const content = await liftEither(
      getStringFromFormData({ name: "content", formData }).chainLeft(() => {
        return getJsonFromFormData({
          formData,
          name: "checklist",
          decoder: ChecklistV2Structured,
        }).map((checklist) => {
          return checklistV2TaskFormToContent({
            checklist,
            getIsCompleted: getIsCompletedFromFormData({ formData }),
          });
        });
      }),
    );

    const checklist = await liftEither(
      ChecklistV2.decode({
        ...metadata,
        createdAtIso: metadata.createdAtIso.toISOString(),
        updatedAtIso: metadata.updatedAtIso.toISOString(),
        name,
        content,
      }),
    );

    return fromPromise(
      update({
        key: (item) => getChecklistV2Key({ id: item.id, user: item.user }),
        decoder: ChecklistV2,
        item: checklist,
      })
        .ifRight((x) => {
          logger.info(
            `Successfully updated checklist with ID '${x.id}' ('${x.name}')`,
          );
          revalidatePath("/checklists");
          revalidatePath(`/checklists/${x.id}`);
          revalidatePath(`/checklists/${x.id}/edit`);
        })
        .ifLeft((e) => {
          logger.error("sdflkjasdflkj");
          logger.error(e);
        }),
    );
  }).run();

  if (response.isRight()) {
    redirect(`/checklists/${response.extract().id}`, RedirectType.push);
  }

  if (response.isLeft()) {
    logger.error("Failed to update checklist");
    logger.error(response.extract());
  }

  return response.toJSON();
};

/**
 * Delete
 */

export const deleteChecklistV2Action = async (
  id: UUID,
): Promise<unknown | void> => {
  const response = await EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(getUserAsEither());

    return fromPromise(
      deleteAll([
        getChecklistV2Key({
          id,
          user: user,
        }),
      ])
        .ifRight(() => {
          logger.info(`Successfully deleted checklist with ID '${id}'`);
          revalidatePath("/checklists");
          revalidatePath(`/checklists/${id}`);
          revalidatePath(`/checklists/${id}/edit`);
        })
        .ifLeft((e) => {
          logger.error(`Failed to delete checklist with ID '${id}'`);
          logger.error(e);
        }),
    );
  }).run();

  return response.toJSON();
};
