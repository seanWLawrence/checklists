import "server-only";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getUser } from "@/lib/auth/get-user";
import { User } from "../types";
import { refreshAuthTokens } from "./refresh-auth-tokens";

export const validateUserLoggedIn = ({
  getUserFn = getUser,
  variant = "model",
}: {
  getUserFn?: typeof getUser;
  /**
   * 'server-action' variant will attempt to refresh auth tokens if no user is found.
   * 'model' variant will simply get the user since we can't write to cookies outside of server-actions or ruote handlers.
   */
  variant?: "server-action" | "model";
}): EitherAsync<unknown, User> => {
  return EitherAsync(async ({ fromPromise, liftEither, throwE }) => {
    if (variant === "server-action") {
      const refreshResponse = await fromPromise(refreshAuthTokens({}));

      return refreshResponse.user;
    }

    if (variant === "model") {
      const userMaybe = await getUserFn({});

      return liftEither(userMaybe.toEither("No user found"));
    }

    return throwE("Invalid variant");
  });
};
