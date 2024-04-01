"use server";
import { Either, Left, Right } from "purify-ts/Either";
import { EitherAsync } from "purify-ts/EitherAsync";
import { date } from "purify-ts/Codec";
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
import { JournalBase, Journal } from "./journal.types";
import { Key, Metadata, User } from "@/lib/types";
import { logger } from "@/lib/logger";

const LOCALE = "en-US";

const PRETTY_DATE_FORMAT = new Intl.DateTimeFormat(LOCALE, {
  month: "long",
  year: "numeric",
  day: "numeric",
});

export const prettyDate = (date: Date): string => {
  return PRETTY_DATE_FORMAT.format(date);
};

const YYYY_MM_DD_FORMAT = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  year: "numeric",
  month: "2-digit",
});

export const yyyyMmDdDate = (date: Date): string => {
  return YYYY_MM_DD_FORMAT.format(date).replaceAll("/", "-");
};

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
  createdAtIso,
}: {
  user: User;
  createdAtIso: Date;
}): Key => `user#${user.username}#journal#${yyyyMmDdDate(createdAtIso)}`;

/**
 * Create
 */

const validateDateIsUnique = (
  createdAtIso: Date,
): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const existingKeys = await fromPromise(getAllJournals());

    await liftEither(
      Either.sequence(
        existingKeys.map((x) => {
          const dateAlreadyExists =
            yyyyMmDdDate(x.createdAtIso) === yyyyMmDdDate(createdAtIso);

          if (dateAlreadyExists) {
            return Left(
              `Journal with date ${yyyyMmDdDate(createdAtIso)} already exists`,
            );
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
    const createdAtIso = await liftEither(
      getStringFromFormData({ name: "createdAtIso", formData }).chain(
        date.decode,
      ),
    );

    await fromPromise(validateDateIsUnique(createdAtIso));

    const content = await liftEither(
      getStringFromFormData({ name: "content", formData }),
    );

    return fromPromise(
      create({
        key: (item) => getJournalKey({ createdAtIso, user: item.user }),
        item: { content },
        decoder: JournalBase,
      })
        .ifLeft((e) => {
          logger.error(`Failed to create journal`);
          logger.error(e);
        })
        .ifRight((journal) => {
          logger.info(
            `Successfully created journal with date '${yyyyMmDdDate(
              journal.createdAtIso,
            )}'`,
          );
          revalidatePath("/journals");
        })
        .run(),
    );
  }).run();

  if (response.isRight()) {
    redirect(
      `/journals/${yyyyMmDdDate(response.extract().createdAtIso)}`,
      RedirectType.push,
    );
  }

  return response.toJSON();
};

/**
 * Read
 */

export const getAllJournals = (): EitherAsync<unknown, Journal[]> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await liftEither(validateLoggedIn());

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
  createdAtIso: Date,
): EitherAsync<unknown, Journal> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await liftEither(validateLoggedIn());
    const key = getJournalKey({ createdAtIso, user });

    return fromPromise(getObjectFromKey({ key, decoder: Journal, user }).run());
  })
    .ifRight((x) => {
      const dateId = yyyyMmDdDate(x.createdAtIso);
      logger.info(`Successfully loaded journal for date '${dateId}'`);
      revalidatePath(`/journals/${dateId}`);
      revalidatePath(`/journals/${dateId}/edit`);
    })
    .ifLeft((e) => {
      logger.error(
        `Failed to load journal with date '${yyyyMmDdDate(createdAtIso)}'`,
      );
      logger.error(e);
    });
};

/**
 * Update
 */

export const updateJournalAction = async (
  formData: FormData,
): Promise<unknown | Journal> => {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const metadata = await liftEither(
      getJsonFromFormData({ name: "metadata", formData, decoder: Metadata }),
    );

    const createdAtIso = await liftEither(
      getStringFromFormData({ name: "createdAtIso", formData }).chain(
        date.decode,
      ),
    );

    const content = await liftEither(
      getStringFromFormData({ name: "content", formData }),
    );

    const dateChanged =
      yyyyMmDdDate(createdAtIso) !== yyyyMmDdDate(metadata.createdAtIso);

    if (dateChanged) {
      const user = await liftEither(validateLoggedIn());
      await fromPromise(
        deleteAll([
          getJournalKey({ user, createdAtIso: metadata.createdAtIso }),
        ]),
      );
    }

    return fromPromise(
      update({
        key: (item) =>
          getJournalKey({ createdAtIso: item.createdAtIso, user: item.user }),
        decoder: Journal,
        item: { ...metadata, createdAtIso, content },
      })
        .ifRight((x) => {
          const dateId = yyyyMmDdDate(x.createdAtIso);
          logger.info(`Successfully updated journal with date '${dateId}'`);
          revalidatePath("/journals");
          revalidatePath(`/journals/${dateId}`);
          revalidatePath(`/journals/${dateId}/edit`);
        })
        .ifLeft(async (e) => {
          const metadata = await liftEither(
            getJsonFromFormData({
              name: "metadata",
              formData,
              decoder: Metadata,
            }),
          );

          logger.error(
            `Failed to update journal with date '${yyyyMmDdDate(
              metadata.createdAtIso,
            )}')`,
          );
          logger.error(e);
        }),
    );
  }).run();

  if (response.isRight()) {
    redirect(
      `/journals/${yyyyMmDdDate(response.extract().createdAtIso)}`,
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
  const response = await EitherAsync(async ({ liftEither }) => {
    const metadata = await liftEither(
      getJsonFromFormData({ name: "metadata", formData, decoder: Metadata }),
    );

    deleteAll([
      getJournalKey({
        createdAtIso: metadata.createdAtIso,
        user: metadata.user,
      }),
    ])
      .ifRight(() => {
        const dateId = yyyyMmDdDate(metadata.createdAtIso);
        logger.info(`Successfully deleted journal with ID '${dateId}'`);
        revalidatePath("/journals");
        revalidatePath(`/journals/${dateId}`);
        revalidatePath(`/journals/${dateId}/edit`);
      })
      .ifLeft((e) => {
        logger.error(
          `Failed to delete checklist with date '${yyyyMmDdDate(
            metadata.createdAtIso,
          )}'`,
        );
        logger.error(e);
      });
  }).run();

  return response.toJSON();
};
