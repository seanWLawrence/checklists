import "server-only";
import { EitherAsync } from "purify-ts/EitherAsync";
import { redirect } from "next/navigation";
import { Either } from "purify-ts/Either";

import { AUTH_SECRET } from "./auth.constants";
import { getStringFromFormData } from "../form-data/get-string-from-form-data";
import { logger } from "../logger";
import { setAuthTokensAndCookies } from "./set-auth-tokens-and-cookies";
import { constantTimeStringComparison } from "./constant-time-string-comparison";
import { revalidatePath } from "next/cache";
import { getSingleItem } from "../db/get-single-item";
import { Key, UserCredentials } from "../types";
import { secureHash } from "./secure-hash";

const getUserCredentialsKey = ({ username }: { username: string }): Key =>
  `user#${username}#credentials`;

export const login = async ({
  formData,
  authSecret: authSecretEither = AUTH_SECRET,
  getStringFromFormDataFn = getStringFromFormData,
  getSingleItemFn = getSingleItem,
  secureHashFn = secureHash,
  setAuthTokensAndCookiesFn = setAuthTokensAndCookies,
  redirectFn = redirect,
  revalidatePathFn = revalidatePath,
}: {
  formData: FormData;
  authSecret?: Either<unknown, string>;
  getStringFromFormDataFn?: typeof getStringFromFormData;
  getSingleItemFn?: typeof getSingleItem;
  secureHashFn?: typeof secureHash;
  setAuthTokensAndCookiesFn?: typeof setAuthTokensAndCookies;
  redirectFn?: typeof redirect;
  revalidatePathFn?: typeof revalidatePath;
}): Promise<void> => {
  const result = await EitherAsync(
    async ({ liftEither, fromPromise, throwE }) => {
      logger.debug("Logging in");

      const username = await liftEither(
        getStringFromFormDataFn({ name: "username", formData }),
      );

      const password = await liftEither(
        getStringFromFormDataFn({ name: "password", formData }),
      );

      logger.debug("Getting user credentials from database");

      const userCredentialsFromDatabase = await fromPromise(
        getSingleItemFn({
          key: getUserCredentialsKey({ username }),
          decoder: UserCredentials,
        }),
      );

      logger.debug(
        "Got user credentials from database, hashing password for comparison",
      );

      const { hash: inputPasswordHash } = await fromPromise(
        secureHashFn({
          value: password,
          saltFn: () => Either.of(userCredentialsFromDatabase.salt),
        }),
      );

      logger.debug("Checking password");

      const passwordValid = constantTimeStringComparison(
        inputPasswordHash,
        userCredentialsFromDatabase.passwordHash,
      );

      if (!passwordValid) {
        logger.debug("Invalid password");

        return throwE("Invalid credentials");
      }

      logger.debug("Password correct");

      const user = { username };

      await fromPromise(
        setAuthTokensAndCookiesFn({ authSecret: authSecretEither, user }),
      );
    },
  ).ifLeft((e) => logger.error(e));

  if (result.isRight()) {
    revalidatePathFn("/", "layout");
    redirectFn("/");
  }
};
