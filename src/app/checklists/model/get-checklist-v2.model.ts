import { EitherAsync } from "purify-ts";

import { getSingleItem } from "@/lib/db/get-single-item";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { logger } from "@/lib/logger";
import { UUID } from "@/lib/types";
import { ChecklistV2 } from "../checklist-v2.types";
import { Key, User } from "@/lib/types";

export const getChecklistV2Key = ({
  user,
  id,
}: {
  user: User;
  id: UUID;
}): Key => `user#${user.username}#checklist-v2#${id}`;

export const getChecklistV2 = (id: UUID): EitherAsync<unknown, ChecklistV2> => {
  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(validateUserLoggedIn({}));
    const key = getChecklistV2Key({ id, user });

    return fromPromise(getSingleItem({ key, decoder: ChecklistV2 }));
  })
    .ifRight((x) => {
      logger.info(
        `Successfully loaded checklist with ID '${x.id}' ('${x.name}')`,
      );
    })
    .ifLeft((e) => {
      logger.error(`Failed to load checklist with ID '${id}'`);
      logger.error(e);
    });
};
