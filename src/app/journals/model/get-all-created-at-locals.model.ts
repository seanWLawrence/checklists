import { logger } from "@/lib/logger";
import { EitherAsync, Either } from "purify-ts";
import { CreatedAtLocal } from "../journal.types";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { scan } from "@/lib/db/scan";

import { Key, User } from "@/lib/types";

export const getAllJournalsScanKey = ({ user }: { user: User }): Key =>
  `user#${user.username}#journal#*`;

export const getAllCreatedAtLocals = (): EitherAsync<
  unknown,
  CreatedAtLocal[]
> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    const validatedKeys = await fromPromise(
      scan({
        key: getAllJournalsScanKey({ user }),
      }),
    );

    return liftEither(
      Either.sequence(
        validatedKeys.map((key) => {
          const createdAtLocal = key.match(/\d{4,}-\d{2,}-\d{2,}$/)?.[0];

          return CreatedAtLocal.decode(createdAtLocal);
        }),
      ),
    );
  })
    .ifRight(() => {
      logger.info(`Successfully loaded all createdAtLocal dates`);
    })
    .ifLeft((e) => {
      logger.error(`Failed to load all createdAtLocal dates`);
      logger.error(e);
    });
};
