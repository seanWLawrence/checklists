import { EitherAsync } from "purify-ts";
import { logger } from "@/lib/logger";
import { scan } from "@/lib/redis/scan";
import { getAllItems } from "@/lib/redis/get-all-items";
import { Key, User } from "@/lib/types";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { LogListItem } from "../log.types";

const getAllLogsScanKey = ({ user }: { user: User }): Key =>
  `user#${user.username}#log#*`;

export const getAllLogs = (): EitherAsync<unknown, LogListItem[]> => {
  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(validateUserLoggedIn({}));

    const keys = await fromPromise(
      scan({
        key: getAllLogsScanKey({ user }),
      }),
    );

    return fromPromise(getAllItems({ keys, decoder: LogListItem }));
  })
    .ifRight(() => {
      logger.info("Successfully loaded all logs");
    })
    .ifLeft((error) => {
      logger.error("Failed to load all logs");
      logger.error(error);
    });
};
