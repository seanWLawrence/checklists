import { EitherAsync } from "purify-ts";

import { getSingleItem } from "@/lib/db/get-single-item";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { logger } from "@/lib/logger";
import { UUID } from "@/lib/types";
import { Note } from "../types";
import { Key, User } from "@/lib/types";

export const getNoteKey = ({ user, id }: { user: User; id: UUID }): Key =>
  `user#${user.username}#note#${id}`;

export const getNote = (id: UUID): EitherAsync<unknown, Note> => {
  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(validateUserLoggedIn({}));
    const key = getNoteKey({ id, user });

    return fromPromise(getSingleItem({ key, decoder: Note }));
  })
    .ifRight((x) => {
      logger.info(`Successfully loaded note with ID '${x.id}' ('${x.name}')`);
    })
    .ifLeft((e) => {
      logger.error(`Failed to load note with ID '${id}'`);
      logger.error(e);
    });
};
