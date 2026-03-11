import { EitherAsync } from "purify-ts";

import { logger } from "@/lib/logger";
import { getSingleItem } from "@/lib/redis/get-single-item";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { UUID } from "@/lib/types";
import { Log } from "../log.types";
import { getLogKey } from "./get-log-key";

export const getLog = (id: UUID): EitherAsync<unknown, Log> => {
  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(validateUserLoggedIn({}));
    const key = getLogKey({ user, id });

    return fromPromise(getSingleItem({ key, decoder: Log }));
  })
    .ifRight((log) => {
      logger.info(`Successfully loaded log '${log.id}' ('${log.name}')`);
    })
    .ifLeft((error) => {
      logger.error(`Failed to load log '${id}'`);
      logger.error(error);
    });
};
