import { Either, Left, Right } from "purify-ts/Either";
import { Key, Metadata, User } from "./types";
import { getUser } from "./auth.model";
import { randomUUID } from "node:crypto";
import { EitherAsync } from "purify-ts/EitherAsync";
import { kv } from "@vercel/kv";
import { Codec, date, intersect } from "purify-ts/Codec";
import { Maybe } from "purify-ts/Maybe";

export const isOk = (response: "OK" | string): boolean => response === "OK";

/**
 * Ensures user has access to the item with the specified key
 */
export const validateUserFromKey = ({
  user,
  key,
}: {
  user: User;
  key: Key;
}): Either<string, User> => {
  const usernameFromKey = key.match(/(?<=user#).*(?=#)/);

  if (usernameFromKey && user.username === usernameFromKey[0]) {
    return Right(user);
  }

  return Left("Forbidden");
};

/**
 * Ensures there's a logged in user and returns the user if true
 */
export const validateLoggedIn = (): Either<string, User> => {
  return getUser().toEither("Not logged in");
};

/**
 * Creates generic metadata object
 */
export const createMetadata = (user: User): Metadata => {
  return {
    id: randomUUID(),
    createdAtIso: date.encode(new Date()),
    updatedAtIso: date.encode(new Date()),
    user,
  };
};

/**
 * Creates an item in the key value store with generic metadata attached automatically
 */
export const create = <T extends object>({
  key,
  item,
  decoder,
}: {
  key: (itemToCreate: T & Metadata) => Key;
  item: T;
  decoder: Codec<T>;
}): EitherAsync<string, T & Metadata> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const user = await liftEither(validateLoggedIn());

    const itemToCreate = await liftEither(
      intersect(Metadata, decoder).decode({ ...createMetadata(user), ...item }),
    );

    const response = await kv.hmset(key(itemToCreate), itemToCreate);

    if (!isOk(response)) {
      throwE(`Failed to create ${key}`);
    }

    return itemToCreate;
  });
};

/**
 * Updates an item in the key value store including it's metadata
 */
export const update = <T extends Metadata & object>({
  key: keyFn,
  item,
  decoder,
}: {
  key: (item: T & Metadata) => Key;
  item: T;
  decoder: Codec<T>;
}): EitherAsync<string, T> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const user = await liftEither(validateLoggedIn());

    const itemToUpdate = await liftEither(
      intersect(Metadata, decoder).decode({
        ...item,
        user,
        updatedAtIso: new Date().toISOString(),
      }),
    );

    const key = keyFn(itemToUpdate);

    await liftEither(validateUserFromKey({ key, user }));

    const response = await kv.hmset(key, itemToUpdate);

    if (!isOk(response)) {
      throwE(`Failed to update ${key}`);
    }

    return item;
  });
};

/**
 * Deletes all items with matching keys in the key value store
 */
export const deleteAll = (keys: Key[]): EitherAsync<string, void> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const user = await liftEither(validateLoggedIn());

    await liftEither(
      Either.sequence(
        keys.map((key) => {
          return validateUserFromKey({ user, key });
        }),
      ),
    );

    const response = await kv.del(...keys);

    if (response === 0) {
      throwE(`Failed to delete one or more ${keys.join(", ")}`);
    }
  });
};

/**
 * Given a key, returns the object from the key value store. Also validates the user has permission
 */
export const getObjectFromKey = <T extends object>({
  key,
  decoder,
  user,
}: {
  key: Key;
  decoder: Codec<T>;
  user: User;
}): EitherAsync<string, T> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    await liftEither(validateUserFromKey({ user, key }));

    const response = Maybe.fromNullable(await kv.get(key));

    if (response.isNothing()) {
      throwE(`Object not found for key: '${key}'`);
    }

    return liftEither(decoder.decode(response.extract()));
  });
};

/**
 * Given a list of keys, returns the objects from the key value store. Also validates the user has permission
 */
export const getAllObjectsFromKeys = <T extends object>({
  keys,
  decoder,
}: {
  keys: Key[];
  decoder: Codec<T>;
}): EitherAsync<string, T[]> => {
  return EitherAsync(async ({ liftEither, fromPromise }) => {
    const user = await liftEither(validateLoggedIn());

    const promises = keys.map((key) => {
      return getObjectFromKey({ user, decoder, key });
    });

    return fromPromise(
      EitherAsync.all(promises)
        .map((values) => {
          return values.filter(Boolean) as T[];
        })
        .run(),
    );
  });
};
