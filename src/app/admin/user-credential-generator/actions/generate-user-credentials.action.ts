"use server";

import { EitherAsync } from "purify-ts";

import { logger } from "@/lib/logger";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { secureHashWithSalt } from "@/lib/auth/secure-hash-with-salt";

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
      secureHashWithSalt({
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
