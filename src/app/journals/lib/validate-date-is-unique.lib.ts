import { EitherAsync, Either, Left, Right } from "purify-ts";

import { CreatedAtLocal } from "../journal.types";
import { getAllCreatedAtLocals } from "../model/get-all-created-at-locals.model";

export const validateDateIsUnique = (
  createdAtLocal: CreatedAtLocal,
): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const existingKeys = await fromPromise(getAllCreatedAtLocals());

    await liftEither(
      Either.sequence(
        existingKeys.map((existingCreatedAtLocal) => {
          const dateAlreadyExists = existingCreatedAtLocal === createdAtLocal;

          if (dateAlreadyExists) {
            return Left(`Journal with date ${createdAtLocal} already exists`);
          }

          return Right(undefined);
        }),
      ),
    );
  });
};
