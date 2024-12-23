import { EitherAsync } from "purify-ts";

import { Key, User } from "@/lib/types";
import { CreatedAtLocal, Journal } from "../journal.types";
import { logger } from "@/lib/logger";
import { getSingleItem } from "@/lib/db/get-single-item";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";

export const getJournalKey = ({
  user,
  createdAtLocal,
}: {
  user: User;
  createdAtLocal: CreatedAtLocal;
}): Key => `user#${user.username}#journal#${createdAtLocal}`;

export const getJournal = (
  createdAtLocal: CreatedAtLocal,
): EitherAsync<unknown, Journal> => {
  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    const key = getJournalKey({ createdAtLocal, user });

    return fromPromise(getSingleItem({ key, decoder: Journal }));
  })
    .ifRight((x) => {
      const dateId = x.createdAtLocal;

      logger.info(`Successfully loaded journal for date '${dateId}'`);
    })
    .ifLeft((e) => {
      logger.error(`Failed to load journal with date '${createdAtLocal}'`);
      logger.error(e);
    });
};
