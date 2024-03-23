"use server";
import { EitherAsync } from "purify-ts/EitherAsync";
import { array } from "purify-ts/Codec";
import { Tuple } from "purify-ts/Tuple";
import { UUID } from "crypto";
import kv from "@vercel/kv";
import { revalidatePath } from "next/cache";
import { RedirectType, redirect } from "next/navigation";

import {
  create,
  deleteAll,
  getAllObjectsFromKeys,
  getObjectFromKey,
  update,
  validateLoggedIn,
} from "@/lib/db.model";

import { Checklist, Key, User, ChecklistBase } from "@/lib/types";

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

export const createChecklist = (
  checklist: ChecklistBase,
): EitherAsync<string, Checklist> => {
  return create({
    key: (item) => getChecklistKey({ id: item.id, user: item.user }),
    item: checklist,
    decoder: ChecklistBase,
  }).ifRight((checklist) => {
    revalidatePath("/checklists");
    redirect(`/checklists/${checklist.id}`, RedirectType.push);
  });
};

/**
 * Read
 */

const getChecklistKeysBatch = ({
  user,
  cursor,
}: {
  user: User;
  cursor?: number;
}): EitherAsync<unknown, Tuple<number /* cursor */, Key[]>> => {
  return EitherAsync(async ({ liftEither }) => {
    const response = Tuple.fromArray(
      await kv.scan(cursor ?? 0, {
        type: "hash",
        match: getAllChecklistsScanKey({ user }),
      }),
    );

    const keys = await liftEither(array(Key).decode(response.snd()));

    return Tuple.fromArray([response.fst(), keys]);
  });
};

const getAllChecklistsKeys = ({
  cursor,
  existingKeys,
}: {
  cursor?: number;
  existingKeys: Key[];
}): EitherAsync<unknown, { cursor?: number; keys: Key[] }> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await liftEither(validateLoggedIn());

    return fromPromise(getChecklistKeysBatch({ user, cursor }).map(async (response) => {
      const nextCursor = response.fst();
      const keys = response.snd();

      const done = nextCursor === 0;
      const allKeysThusFar = [...existingKeys, ...keys];

      if (done) {
        return { keys: allKeysThusFar };
      }

      /**
       * We still have more to iterate through, recursively call until no more left
       */
      return fromPromise(
        getAllChecklistsKeys({
          cursor: response.fst(),
          existingKeys: allKeysThusFar,
        }).run(),
      );
    }));
  })
};

export const getAllChecklists = (): EitherAsync<unknown, Checklist[]> => {
  return EitherAsync(async ({ fromPromise }) => {
    const { keys: validatedKeys } = await fromPromise(
      getAllChecklistsKeys({ existingKeys: [] }),
    );

    return await fromPromise(
      getAllObjectsFromKeys({ keys: validatedKeys, decoder: Checklist }),
    );
  });
};

export const getChecklist = (id: UUID): EitherAsync<string, Checklist> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await liftEither(validateLoggedIn());
    const key = getChecklistKey({ id, user });

    return fromPromise(
      getObjectFromKey({ key, decoder: Checklist, user }).run(),
    );
  });
};

/**
 * Update
 */

export const updateChecklist = (
  checklist: Checklist,
): EitherAsync<string, Checklist> => {
  return update({
    key: (item) => getChecklistKey({ id: item.id, user: item.user }),
    decoder: Checklist,
    item: checklist,
  });
};

/**
 * Delete
 */

export const deleteChecklist = (
  checklist: Checklist,
): EitherAsync<string, void> => {
  return deleteAll([
    getChecklistKey({
      id: checklist.id,
      user: checklist.user,
    }),
  ]);
};
