"use server";
import { Either, Left, Right } from "purify-ts/Either";
import { EitherAsync } from "purify-ts/EitherAsync";
import { revalidatePath } from "next/cache";
import { RedirectType, redirect } from "next/navigation";
import {
  create,
  deleteAll,
  getAllItemsKeys,
  getAllObjectsFromKeys,
  getJsonFromFormData,
  getObjectFromKey,
  getStringFromFormData,
  update,
  validateLoggedIn,
} from "@/lib/db.model";
import { JournalBase, Journal, CreatedAtLocal, Level } from "./journal.types";
import { Key, Metadata, User } from "@/lib/types";
import { logger } from "@/lib/logger";

/**
 * Gets all journal keys for a given user
 */
const getAllJournalsScanKey = ({ user }: { user: User }): Key =>
  `user#${user.username}#journal#*`;

/**
 * Gets a journal key for a given user
 */
const getJournalKey = ({
  user,
  createdAtLocal,
}: {
  user: User;
  createdAtLocal: CreatedAtLocal;
}): Key => `user#${user.username}#journal#${createdAtLocal}`;

/**
 * Create
 */

const validateDateIsUnique = (
  createdAtLocal: CreatedAtLocal,
): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const existingKeys = await fromPromise(getAllJournals());

    await liftEither(
      Either.sequence(
        existingKeys.map((x) => {
          const dateAlreadyExists = x.createdAtLocal === createdAtLocal;

          if (dateAlreadyExists) {
            return Left(`Journal with date ${createdAtLocal} already exists`);
          }

          return Right(undefined);
        }),
      ),
    );
  });
};

export const createJournalAction = async (
  formData: FormData,
): Promise<unknown | Journal> => {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
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

    return fromPromise(
      create({
        key: (item) => getJournalKey({ createdAtLocal, user: item.user }),
        item: {
          content,
          createdAtLocal,
          moodLevel,
          energyLevel,
          healthLevel,
          creativityLevel,
          relationshipsLevel,
        },
        decoder: JournalBase,
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
        })
        .run(),
    );
  }).run();

  if (response.isRight()) {
    redirect(
      `/journals/${response.extract().createdAtLocal}`,
      RedirectType.push,
    );
  }

  return response.toJSON();
};

/**
 * Read
 */

export const getAllJournals = (): EitherAsync<unknown, Journal[]> => {
  const userEither = validateLoggedIn();

  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await liftEither(userEither);

    const { keys: validatedKeys } = await fromPromise(
      getAllItemsKeys({
        existingKeys: [],
        scanKey: getAllJournalsScanKey({ user }),
      }),
    );

    return fromPromise(
      getAllObjectsFromKeys({ keys: validatedKeys, decoder: Journal }),
    );
  })
    .ifRight(() => {
      logger.info(`Successfully loaded all journals`);
      revalidatePath("/journals");
    })
    .ifLeft((e) => {
      logger.error(`Failed to load all journals`);
      logger.error(e);
    });
};

export const getJournal = (
  createdAtLocal: CreatedAtLocal,
): EitherAsync<unknown, Journal> => {
  const userEither = validateLoggedIn();

  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await liftEither(userEither);
    const key = getJournalKey({ createdAtLocal, user });

    return fromPromise(getObjectFromKey({ key, decoder: Journal, user }).run());
  })
    .ifRight((x) => {
      const dateId = x.createdAtLocal;
      logger.info(`Successfully loaded journal for date '${dateId}'`);
      revalidatePath(`/journals/${dateId}`);
      revalidatePath(`/journals/${dateId}/edit`);
    })
    .ifLeft((e) => {
      logger.error(`Failed to load journal with date '${createdAtLocal}'`);
      logger.error(e);
    });
};

/**
 * Update
 */

export const updateJournalAction = async (
  formData: FormData,
): Promise<unknown | Journal> => {
  const userEither = validateLoggedIn();

  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const metadata = await liftEither(
      getJsonFromFormData({ name: "metadata", formData, decoder: Metadata }),
    );

    const existingCreatedAtLocal = await liftEither(
      getStringFromFormData({ name: "existingCreatedAtLocal", formData }).chain(
        CreatedAtLocal.decode,
      ),
    );

    const createdAtLocal = await liftEither(
      getStringFromFormData({ name: "createdAtLocal", formData }).chain(
        CreatedAtLocal.decode,
      ),
    );

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

    const dateChanged = createdAtLocal !== existingCreatedAtLocal;

    if (dateChanged) {
      const user = await liftEither(userEither);

      await fromPromise(
        deleteAll([
          getJournalKey({ user, createdAtLocal: existingCreatedAtLocal }),
        ]),
      );

      return fromPromise(
        create({
          key: (item) => getJournalKey({ createdAtLocal, user: item.user }),
          decoder: Journal,
          item: {
            ...metadata,
            createdAtLocal,
            content,
            energyLevel,
            moodLevel,
            healthLevel,
            creativityLevel,
            relationshipsLevel,
          },
        })
          .ifRight((x) => {
            const dateId = x.createdAtLocal;
            logger.info(`Successfully updated journal with date '${dateId}'`);
            revalidatePath("/journals");
            revalidatePath(`/journals/${dateId}`);
            revalidatePath(`/journals/${dateId}/edit`);
          })
          .ifLeft(async (e) => {
            const createdAtLocal = await liftEither(
              getStringFromFormData({ name: "createdAtLocal", formData }).chain(
                CreatedAtLocal.decode,
              ),
            );

            logger.error(
              `Failed to update journal with date '${createdAtLocal}')`,
            );
            logger.error(e);
          }),
      );
    }

    return fromPromise(
      update({
        key: (item) => getJournalKey({ createdAtLocal, user: item.user }),
        decoder: Journal,
        item: {
          ...metadata,
          createdAtLocal,
          content,
          energyLevel,
          moodLevel,
          healthLevel,
          creativityLevel,
          relationshipsLevel,
        },
      })
        .ifRight((x) => {
          const dateId = x.createdAtLocal;
          logger.info(`Successfully updated journal with date '${dateId}'`);
          revalidatePath("/journals");
          revalidatePath(`/journals/${dateId}`);
          revalidatePath(`/journals/${dateId}/edit`);
        })
        .ifLeft(async (e) => {
          const createdAtLocal = await liftEither(
            getStringFromFormData({ name: "createdAtLocal", formData }).chain(
              CreatedAtLocal.decode,
            ),
          );

          logger.error(
            `Failed to update journal with date '${createdAtLocal}')`,
          );
          logger.error(e);
        }),
    );
  }).run();

  if (response.isRight()) {
    redirect(
      `/journals/${response.extract().createdAtLocal}`,
      RedirectType.push,
    );
  }

  return response.toJSON();
};

/**
 * Delete
 */

export const deleteJournalAction = async (
  formData: FormData,
): Promise<unknown | void> => {
  const response = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const createdAtLocal = await liftEither(
      getStringFromFormData({ name: "createdAtLocal", formData }).chain(
        CreatedAtLocal.decode,
      ),
    );

    const metadata = await liftEither(
      getJsonFromFormData({ name: "metadata", formData, decoder: Metadata }),
    );

    return fromPromise(
      deleteAll([
        getJournalKey({
          createdAtLocal,
          user: metadata.user,
        }),
      ])
        .ifRight(() => {
          const dateId = createdAtLocal;
          logger.info(`Successfully deleted journal with ID '${dateId}'`);
          revalidatePath("/journals");
          revalidatePath(`/journals/${dateId}`);
          revalidatePath(`/journals/${dateId}/edit`);
        })
        .ifLeft((e) => {
          logger.error(
            `Failed to delete checklist with date '${createdAtLocal}'`,
          );
          logger.error(e);
        }),
    );
  }).run();

  if (response.isRight()) {
    redirect("/journals", RedirectType.push);
  }

  return response.toJSON();
};
