"use server";
import { UUID } from "crypto";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Either, Left, Right } from "purify-ts/Either";
import { Maybe } from "purify-ts/Maybe";

import { revalidatePath } from "next/cache";
import { RedirectType, redirect } from "next/navigation";
import {
  create,
  deleteAll,
  getAllItemsKeys,
  getAllObjectsFromKeys,
  getObjectFromKey,
  update,
  validateLoggedIn,
} from "@/lib/db.model";
import { ChecklistBase, Checklist, ChecklistSection } from "./checklist.types";
import { Key, User } from "@/lib/types";
import { logger } from "@/lib/logger";

/**
 * Gets all checklist keys for a given user
 */
const getAllChecklistsScanKey = ({ user }: { user: User }): Key =>
  `user#${user.username}#checklist#*`;

/**
 * Gets a checklist key for a given user
 */
const getChecklistKey = ({ user, id }: { user: User; id: UUID }): Key =>
  `user#${user.username}#checklist#${id}`;

/**
 * Create
 */

export const createChecklistAction = async (
  checklist: ChecklistBase,
): Promise<unknown | Checklist> => {
  const response = await create({
    key: (item) => getChecklistKey({ id: item.id, user: item.user }),
    item: checklist,
    decoder: ChecklistBase,
  })
    .ifLeft((e) => {
      logger.error(`Failed to create checklist '${checklist.name}'`);
      logger.error(e);
    })
    .ifRight((checklist) => {
      logger.info(
        `Successfully created checklist with ID '${checklist.id}' ('${checklist.name}')`,
      );
      revalidatePath("/checklists");
    })
    .run();

  if (response.isRight()) {
    redirect(`/checklists/${response.extract().id}`, RedirectType.push);
  }

  return response.toJSON();
};

/**
 * Read
 */

export const getAllChecklists = (): EitherAsync<unknown, Checklist[]> => {
  const userEither = validateLoggedIn();

  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await liftEither(userEither);

    const { keys: validatedKeys } = await fromPromise(
      getAllItemsKeys({
        existingKeys: [],
        scanKey: getAllChecklistsScanKey({ user }),
      }),
    );

    return await fromPromise(
      getAllObjectsFromKeys({ keys: validatedKeys, decoder: Checklist }),
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

export const getChecklist = (id: UUID): EitherAsync<unknown, Checklist> => {
  const userEither = validateLoggedIn();

  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await liftEither(userEither);
    const key = getChecklistKey({ id, user });

    return fromPromise(
      getObjectFromKey({ key, decoder: Checklist, user }).run(),
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

export const updateChecklist_serverOnly = (
  checklist: Checklist,
): EitherAsync<unknown, Checklist> => {
  return update({
    key: (item) => getChecklistKey({ id: item.id, user: item.user }),
    decoder: Checklist,
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
      logger.error(
        `Failed to update checklist with ID '${checklist.id}' ('${checklist.name}')`,
      );
      logger.error(e);
    });
};

export const updateChecklistAction = async (
  checklist: Checklist,
): Promise<unknown | Checklist> => {
  const response = await updateChecklist_serverOnly(checklist).run();

  if (response.isRight()) {
    redirect(`/checklists/${response.extract().id}`, RedirectType.push);
  }

  return response.toJSON();
};

const getChecklistFromFormData = (
  formData: FormData,
): Either<unknown, Checklist> => {
  return Maybe.fromNullable(formData.get("checklist"))
    .toEither(() => "Missing checklist formData")
    .chain((x) =>
      typeof x === "string"
        ? Right(x)
        : Left("Checklist formData is wrong type."),
    )
    .chain((x) => Either.encase(() => JSON.parse(x)))
    .chain(Checklist.decode);
};

export const markItemsIncompleteAction = async (
  formData: FormData,
): Promise<Checklist | unknown> => {
  const response = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const itemsBySectionId: Record<string /* sectionId */, ChecklistSection> =
      {};

    const checklist = await liftEither(getChecklistFromFormData(formData));

    checklist.sections.forEach((section) => {
      itemsBySectionId[section.id] = {
        ...section,
        items: section.items.map((item) => {
          return { ...item, completed: false };
        }),
      };
    });

    const updatedChecklist: Checklist = {
      ...checklist,
      sections: [],
    };

    Object.values(itemsBySectionId).forEach((section) => {
      updatedChecklist.sections.push(section);
    });

    return fromPromise(updateChecklist_serverOnly(updatedChecklist).run());
  })
    .ifRight((x) => {
      logger.info(
        `Successfully marked items incomplete for ID '${x.id}' ('${x.name}')`,
      );
      logger.info(x);
      revalidatePath(`/checklists/${x.id}`);
      revalidatePath(`/checklists/${x.id}/edit`);
    })
    .ifLeft((e) => {
      getChecklistFromFormData(formData)
        .ifRight((checklist) => {
          logger.error(
            `Failed to mark items incomplete with ID '${checklist.id}' '(${checklist.name})'`,
          );
        })
        .extract();

      logger.error(e);
    })
    .run();

  return response.toJSON();
};

export const updateChecklistItemsAction = async (
  formData: FormData,
): Promise<Checklist | unknown> => {
  const response = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const itemsBySectionId: Record<string /* sectionId */, ChecklistSection> =
      {};

    const checklist = await liftEither(getChecklistFromFormData(formData));

    checklist.sections.forEach((section) => {
      itemsBySectionId[section.id] = {
        ...section,
        items: section.items.map((item) => {
          const checked = Maybe.fromNullable(formData.get(`item__${item.id}`))
            .map((item) => item === "on")
            .ifNothing(() => {
              logger.error(
                `Failed to find formData for item with ID '${item.id}' '(${item.name})'`,
              );
            })
            .orDefault(false);

          return { ...item, completed: checked };
        }),
      };
    });

    const updatedChecklist: Checklist = {
      ...checklist,
      sections: [],
    };

    Object.values(itemsBySectionId).forEach((section) => {
      updatedChecklist.sections.push(section);
    });

    return fromPromise(updateChecklist_serverOnly(updatedChecklist).run());
  })
    .ifRight((x) => {
      logger.info(`Successfully updated items for ID '${x.id}' ('${x.name}')`);
      logger.info(x);

      revalidatePath(`/checklists/${x.id}`);
      revalidatePath(`/checklists/${x.id}/edit`);
    })
    .ifLeft((e) => {
      getChecklistFromFormData(formData)
        .ifRight((checklist) => {
          logger.error(
            `Failed to update items with ID '${checklist.id}' '(${checklist.name})'`,
          );
        })
        .extract();

      logger.error(e);
    })
    .run();

  return response.toJSON();
};

/**
 * Delete
 */

export const deleteChecklistAction = async (
  checklist: Pick<Checklist, "id" | "user">,
): Promise<unknown | void> => {
  const response = await deleteAll([
    getChecklistKey({
      id: checklist.id,
      user: checklist.user,
    }),
  ])
    .ifRight(() => {
      logger.info(`Successfully deleted checklist with ID '${checklist.id}'`);
      revalidatePath("/checklists");
      revalidatePath(`/checklists/${checklist.id}`);
      revalidatePath(`/checklists/${checklist.id}/edit`);
    })
    .ifLeft((e) => {
      logger.error(`Failed to delete checklist with ID '${checklist.id}'`);
      logger.error(e);
    })
    .run();

  return response.toJSON();
};
