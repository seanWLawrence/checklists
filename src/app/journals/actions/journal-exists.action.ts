"use server";
import { EitherAsync } from "purify-ts/EitherAsync";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getSingleItem } from "@/lib/db/get-single-item";
import { getJournalKey } from "../model/get-journal.model";
import { CreatedAtLocal, Journal } from "../journal.types";

export const journalExistsAction = async (
  createdAtLocal: string,
): Promise<boolean> => {
  const rersult = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: 'server-action' }),
    );
    const date = await liftEither(CreatedAtLocal.decode(createdAtLocal));

    await fromPromise(
      getSingleItem({
        key: getJournalKey({
          user,
          createdAtLocal: date,
        }),
        decoder: Journal,
      }),
    );
  })
    .mapLeft(() => false)
    .map(() => true)
    .run();

  return rersult.extract();
};
