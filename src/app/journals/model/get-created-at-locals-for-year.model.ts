import { logger } from "@/lib/logger";
import { Either, EitherAsync } from "purify-ts";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { scan } from "@/lib/db/scan";
import { Key, User } from "@/lib/types";
import { CreatedAtLocal } from "../journal.types";

const getJournalScanKeyForYear = ({
  user,
  year,
}: {
  user: User;
  year: string;
}): Key => `user#${user.username}#journal#${year}-*`;

export const getCreatedAtLocalsForYear = ({
  year,
}: {
  year: string;
}): EitherAsync<unknown, CreatedAtLocal[]> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    const keys = await fromPromise(
      scan({
        key: getJournalScanKeyForYear({ user, year }),
      }),
    );

    return liftEither(
      Either.sequence(
        keys.map((key) => {
          const createdAtLocal = key.match(/\d{4,}-\d{2,}-\d{2,}$/)?.[0];
          return CreatedAtLocal.decode(createdAtLocal);
        }),
      ),
    );
  })
    .ifRight(() => {
      logger.info(`Successfully loaded createdAtLocal dates for year ${year}`);
    })
    .ifLeft((e) => {
      logger.error(`Failed to load createdAtLocal dates for year ${year}`);
      logger.error(e);
    });
};
