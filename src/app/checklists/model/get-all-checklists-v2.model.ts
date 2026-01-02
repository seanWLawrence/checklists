import { logger } from "@/lib/logger";
import { EitherAsync } from "purify-ts";
import { ChecklistV2 } from "../checklist-v2.types";
import { scan } from "@/lib/db/scan";
import { getAllItems } from "@/lib/db/get-all-items";
import { Key, User } from "@/lib/types";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";

const getAllChecklistsV2ScanKey = ({ user }: { user: User }): Key =>
  `user#${user.username}#checklist-v2#*`;

export const getAllChecklistsV2 = (): EitherAsync<unknown, ChecklistV2[]> => {
  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    const validatedKeys = await fromPromise(
      scan({
        key: getAllChecklistsV2ScanKey({ user }),
      }),
    );

    return await fromPromise(
      getAllItems({ keys: validatedKeys, decoder: ChecklistV2 }),
    );
  })
    .ifRight(() => {
      logger.info(`Successfully loaded all checklists`);
    })
    .ifLeft((e) => {
      logger.error(`Failed to load all checklists`);
      logger.error("Error", e);
    });
};
