import "server-only";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getUser } from "@/lib/auth/get-user";
import { User } from "../types";
import { refreshAuthTokens } from "./refresh-auth-tokens";
import { NextRequest } from "next/server";

export const validateUserLoggedIn = ({
  getUserFn = getUser,
  variant = "model",
  request,
}: {
  getUserFn?: typeof getUser;
  /**
   * 'server-action' variant will attempt to refresh auth tokens if no user is found.
   * 'model' variant will simply get the user since we can't write to cookies outside of server-actions or route handlers.
   */
  variant?: "server-action" | "model";
  request?: Pick<NextRequest, "url"> & { cookies: NextRequest["cookies"] };
}): EitherAsync<unknown, User> => {
  return EitherAsync(async ({ fromPromise, liftEither, throwE }) => {
    if (variant === "server-action") {
      const refreshResponse = await fromPromise(refreshAuthTokens({ request }));

      return refreshResponse.user;
    }

    if (variant === "model") {
      const userMaybe = await getUserFn({ request });

      return liftEither(userMaybe.toEither("No user found"));
    }

    return throwE("Invalid variant");
  });
};
