"use server";

import { EitherAsync } from "purify-ts";

import { logger } from "@/lib/logger";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { secureHash } from "@/lib/auth/secure-hash";

export const generateUserCredentialsAction = async (
  _prevState: unknown,
  formData: FormData,
): Promise<{
  passwordHash: string;
  salt: string;
}> => {
  const result = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const password = await liftEither(
      getStringFromFormData({ name: "password", formData }),
    );

    const { hash: passwordHash, salt } = await fromPromise(
      secureHash({
        value: password,
      }),
    );

    return { passwordHash, salt };
  }).mapLeft((error) => {
    logger.error("Error generating user credentials", error);

    return { passwordHash: "", salt: "" };
  });

  return result.extract();
};
