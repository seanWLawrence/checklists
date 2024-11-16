import { EitherAsync } from "purify-ts/EitherAsync";
import { redirect } from "next/navigation";
import { Either } from "purify-ts/Either";

import { AUTH_SECRET } from "./auth.constants";
import { getStringFromFormData } from "../form-data/get-string-from-form-data";
import { logger } from "../logger";
import { setAuthTokensAndCookies } from "./set-tokens-and-cookies";

export const login = async ({
  formData,
  authSecret: authSecretEither = AUTH_SECRET,
  getStringFromFormDataFn = getStringFromFormData,
  setAuthTokensAndCookiesFn = setAuthTokensAndCookies,
  redirectFn = redirect,
}: {
  formData: FormData;
  authSecret?: Either<unknown, string>;
  getStringFromFormDataFn?: typeof getStringFromFormData;
  setAuthTokensAndCookiesFn?: typeof setAuthTokensAndCookies;
  redirectFn?: typeof redirect;
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

      const authSecret = await liftEither(authSecretEither);

      if (authSecret !== password) {
        logger.debug("Invalid password");

        return throwE("Invalid credentials");
      }

      logger.debug("Valid password, setting auth tokens and cookies");

      const user = { username };

      await fromPromise(
        setAuthTokensAndCookiesFn({ authSecret: authSecretEither, user }),
      );
    },
  ).ifLeft((e) => logger.error(e));

  if (result.isRight()) {
    redirectFn("/");
  }
};
