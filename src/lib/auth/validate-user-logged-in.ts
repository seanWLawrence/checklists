import "server-only";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getUser } from "@/lib/auth/get-user";
import { User } from "../types";
import { logger } from "../logger";

export const validateUserLoggedIn = ({
  getUserFn = getUser,
}: {
  getUserFn?: typeof getUser;
}): EitherAsync<unknown, User> => {
  return EitherAsync(async ({ fromPromise, throwE }) => {
    const user = await fromPromise(getUserFn({}));

    if (user === null) {
      logger.debug("User not found");

      return throwE("No user found");
    }

    logger.debug("Found user");

    return user;
  });
};
