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
import {
  JournalBase,
  Journal,
  CreatedAtLocal,
  Level,
  JournalLevels,
} from "./journal.types";
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

/**
 * Analytics
 */
export type JournalLevelsRadarChartDataType = {
  name: string;
  average: number;
  median: number;
  eightiethPercentile: number;
  twentiethPercentile: number;
  levelType: keyof JournalLevels;
  fullMark: number;
};
export type RadarChartData = JournalLevelsRadarChartDataType[];

interface JournalLevelTypeAndValueCount {
  name: string;
  /**
   * @example Energy
   */
  total: number;
  levels: number[];
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

const toTenthsDecimal = (num: number): number => Number(num.toFixed(2));

const average = ({ total, num }: { total: number; num: number }): number =>
  toTenthsDecimal(num / total);

const median = (levels: JournalLevelTypeAndValueCount["levels"]): number => {
  const medianIndex = Math.floor(levels.length / 2);

  return [...levels.sort()][medianIndex];
};

const percentile = ({
  percentile,
  totals,
}: {
  percentile: number;
  totals: JournalLevelTypeAndValueCount;
}) => {
  const sortedNums = [...totals.levels.sort()];

  const rank = percentile * (sortedNums.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);

  if (lowerIndex === upperIndex) {
    return sortedNums[lowerIndex];
  } else {
    const lowerValue = sortedNums[lowerIndex];
    const upperValue = sortedNums[upperIndex];
    return toTenthsDecimal(
      lowerValue + (upperValue - lowerValue) * (rank - lowerIndex),
    );
  }
};

// Max level, this is what it's called in the Recharts
const maxLevel = 5;

type TotalLevelsByTypeAndValue = Record<
  keyof JournalLevels,
  JournalLevelTypeAndValueCount
>;

const getTotalLevelsByTypeAndValue = (
  levels: JournalLevels[],
): TotalLevelsByTypeAndValue => {
  const result: TotalLevelsByTypeAndValue = {
    energyLevel: {
      name: "Energy",
      total: 0,
      levels: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    moodLevel: {
      name: "Mood",
      total: 0,
      levels: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    healthLevel: {
      name: "Health",
      total: 0,
      levels: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    creativityLevel: {
      name: "Creativity",
      total: 0,
      levels: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    relationshipsLevel: {
      name: "Relationships",
      total: 0,
      levels: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };

  for (const {
    creativityLevel,
    energyLevel,
    moodLevel,
    healthLevel,
    relationshipsLevel,
  } of levels) {
    if (energyLevel) {
      const num = Number(energyLevel);
      result.energyLevel.total += num;
      result.energyLevel[energyLevel] += 1;
      result.energyLevel.levels.push(num);
    }
    if (moodLevel) {
      const num = Number(moodLevel);
      result.moodLevel.total += num;
      result.moodLevel[moodLevel] += 1;
      result.moodLevel.levels.push(num);
    }

    if (healthLevel) {
      const num = Number(healthLevel);
      result.healthLevel.total += num;
      result.healthLevel[healthLevel] += 1;
      result.healthLevel.levels.push(num);
    }

    if (creativityLevel) {
      const num = Number(creativityLevel);
      result.creativityLevel.total += num;
      result.creativityLevel[creativityLevel] += 1;
      result.creativityLevel.levels.push(num);
    }

    if (relationshipsLevel) {
      const num = Number(relationshipsLevel);
      result.relationshipsLevel.total += num;
      result.relationshipsLevel[relationshipsLevel] += 1;
      result.relationshipsLevel.levels.push(num);
    }
  }

  return result;
};

export type PieChartData = {
  level: "1" | "2" | "3" | "4" | "5";
  /**
   * @example "Energy (Level 1)"
   */
  name: string;
  count: number;
}[][];

const pieChartData = (levels: JournalLevels[]): PieChartData => {
  const totalLevelsByTypeAndValue: TotalLevelsByTypeAndValue =
    getTotalLevelsByTypeAndValue(levels);

  const result: PieChartData = [];

  for (const level of Object.values(totalLevelsByTypeAndValue)) {
    const levelData: PieChartData[0] = [];

    for (let i = 1; i <= maxLevel; i++) {
      levelData.push({
        name: level.name,
        level: i.toString() as PieChartData[0][0]["level"],
        count: level[i.toString() as PieChartData[0][0]["level"]],
      });
    }

    result.push(levelData);
  }

  return result;
};

const radarChartData = (levels: JournalLevels[]): RadarChartData => {
  const totalLevelsByTypeAndValue: TotalLevelsByTypeAndValue =
    getTotalLevelsByTypeAndValue(levels);

  const total = levels.length;

  return [
    {
      name: "Energy",
      levelType: "energyLevel" as const,
      average: average({
        total,
        num: totalLevelsByTypeAndValue.energyLevel.total,
      }),
      median: median(totalLevelsByTypeAndValue.energyLevel.levels),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalLevelsByTypeAndValue.energyLevel,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalLevelsByTypeAndValue.energyLevel,
      }),
      fullMark: maxLevel,
    },
    {
      name: "Mood",
      levelType: "moodLevel" as const,
      average: average({
        total,
        num: totalLevelsByTypeAndValue.moodLevel.total,
      }),
      median: median(totalLevelsByTypeAndValue.moodLevel.levels),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalLevelsByTypeAndValue.moodLevel,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalLevelsByTypeAndValue.moodLevel,
      }),
      fullMark: maxLevel,
    },
    {
      name: "Health",
      levelType: "healthLevel" as const,
      average: average({
        total,
        num: totalLevelsByTypeAndValue.healthLevel.total,
      }),
      median: median(totalLevelsByTypeAndValue.healthLevel.levels),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalLevelsByTypeAndValue.healthLevel,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalLevelsByTypeAndValue.healthLevel,
      }),
      fullMark: maxLevel,
    },
    {
      name: "Creativity",
      levelType: "creativityLevel" as const,
      average: average({
        total,
        num: totalLevelsByTypeAndValue.creativityLevel.total,
      }),
      median: median(totalLevelsByTypeAndValue.creativityLevel.levels),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalLevelsByTypeAndValue.creativityLevel,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalLevelsByTypeAndValue.creativityLevel,
      }),
      fullMark: maxLevel,
    },
    {
      name: "Relation",
      levelType: "relationshipsLevel" as const,
      average: average({
        total,
        num: totalLevelsByTypeAndValue.relationshipsLevel.total,
      }),
      median: median(totalLevelsByTypeAndValue.relationshipsLevel.levels),
      eightiethPercentile: percentile({
        percentile: 0.8,
        totals: totalLevelsByTypeAndValue.relationshipsLevel,
      }),
      twentiethPercentile: percentile({
        percentile: 0.2,
        totals: totalLevelsByTypeAndValue.relationshipsLevel,
      }),
      fullMark: maxLevel,
    },
  ];
};

export const getJournalLevelsRadarChartData = (): EitherAsync<
  unknown,
  {
    radar: RadarChartData;
    pie: PieChartData;
  }
> => {
  const userEither = validateLoggedIn();

  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await liftEither(userEither);

    const { keys: validatedKeys } = await fromPromise(
      getAllItemsKeys({
        existingKeys: [],
        scanKey: getAllJournalsScanKey({ user }),
      }),
    );

    const levels = await fromPromise(
      getAllObjectsFromKeys({ keys: validatedKeys, decoder: JournalLevels }),
    );

    return { radar: radarChartData(levels), pie: pieChartData(levels) };
  })
    .ifRight(() => {
      logger.info(`Successfully loaded all journal levels`);
      revalidatePath("/journals/data-analytics");
    })
    .ifLeft((e) => {
      logger.error(`Failed to load all journal levels`);
      logger.error(e);
    });
};
