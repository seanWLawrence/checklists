import { logger } from "@/lib/logger";
import { EitherAsync } from "purify-ts";
import { Note } from "../types";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { scan } from "@/lib/db/scan";
import { getAllItems } from "@/lib/db/get-all-items";
import { Key, User } from "@/lib/types";

const getAllNotesScanKey = ({ user }: { user: User }): Key =>
  `user#${user.username}#note#*`;

export const getAllNotes = (): EitherAsync<unknown, Note[]> => {
  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    const validatedKeys = await fromPromise(
      scan({
        key: getAllNotesScanKey({ user }),
      }),
    );

    return await fromPromise(
      getAllItems({ keys: validatedKeys, decoder: Note }),
    );
  })
    .ifRight(() => {
      logger.info(`Successfully loaded all notes`);
    })
    .ifLeft((e) => {
      logger.error(`Failed to load all notes`);
      logger.error(e);
    });
};
