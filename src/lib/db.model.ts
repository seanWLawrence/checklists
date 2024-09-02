import { Either, Left, Right } from "purify-ts/Either";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Codec, array, date, intersect } from "purify-ts/Codec";
import { Maybe } from "purify-ts/Maybe";
import { kv } from "@vercel/kv";
import { Redis } from "@upstash/redis";

import { Key, Metadata, User } from "./types";
import { getUser } from "@/lib/auth.model";
import { id } from "@/factories/id.factory";
import { logger } from "./logger";
import { Tuple } from "purify-ts/Tuple";

export const client =
  process.env.NODE_ENV === "development"
    ? new Redis({
        url: "http://localhost:8079",
        token: "example_token",
      })
    : kv;

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
  const usernameFromKey = key.match(/(?<=user#)[^#]*(?=#)/);

  if (usernameFromKey && user.username === usernameFromKey[0]) {
    return Right(user);
  }

  return Left("Forbidden");
};

/**
 * Ensures there's a logged in user and returns the user if true
 */
export const getUserAsEither = async (): Promise<Either<string, User>> => {
  const user = await getUser();

  return user.toEither("Not logged in").ifLeft(logger.error);
};

/**
 * Creates generic metadata object
 */
export const createMetadata = (user: User): Metadata => {
  return {
    id: id(),
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
}): EitherAsync<unknown, T & Metadata> => {
  return EitherAsync(async ({ liftEither, fromPromise, throwE }) => {
    const user = await fromPromise(getUserAsEither());

    const itemToCreate = await liftEither(
      intersect(Metadata, decoder).decode({ ...item, ...createMetadata(user) }),
    );

    const response = await client.hmset(key(itemToCreate), itemToCreate);

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
}): EitherAsync<unknown, T> => {
  return EitherAsync(async ({ liftEither, fromPromise, throwE }) => {
    const user = await fromPromise(getUserAsEither());

    const itemToUpdate = await liftEither(
      intersect(Metadata, decoder).decode({
        ...item,
        user,
        createdAtIso: date.encode(item.createdAtIso),
        updatedAtIso: new Date().toISOString(),
      }),
    );

    const key = keyFn(itemToUpdate);

    await liftEither(validateUserFromKey({ key, user }));

    const response = await client.hmset(key, itemToUpdate);

    if (!isOk(response)) {
      throwE(`Failed to update ${key}`);
    }

    return item;
  });
};

/**
 * Deletes all items with matching keys in the key value store
 */
export const deleteAll = (keys: Key[]): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ liftEither, fromPromise, throwE }) => {
    const user = await fromPromise(getUserAsEither());

    await liftEither(
      Either.sequence(
        keys.map((key) => {
          return validateUserFromKey({ user, key });
        }),
      ),
    );

    const response = await client.del(...keys);

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
}): EitherAsync<unknown, T> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    await liftEither(validateUserFromKey({ user, key }));

    const response = Maybe.fromNullable(await client.hgetall(key));

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
}): EitherAsync<unknown, T[]> => {
  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(getUserAsEither());

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

const getItemsKeysBatch = ({
  user,
  cursor,
  scanKey,
}: {
  user: User;
  cursor?: number;
  scanKey: Key;
}): EitherAsync<unknown, Tuple<number /* cursor */, Key[]>> => {
  return EitherAsync(async ({ liftEither }) => {
    const response = Tuple.fromArray(
      await client.scan(cursor ?? 0, {
        type: "hash",
        match: scanKey,
      }),
    );

    const keys = await liftEither(
      array(Key)
        .decode(response.snd())
        .chain((keys) =>
          Either.sequence(
            keys.map((key) => {
              return validateUserFromKey({ user, key }).map(() => key);
            }),
          ),
        ),
    );

    return Tuple.fromArray([response.fst(), keys]);
  });
};

export const getAllItemsKeys = ({
  cursor,
  existingKeys,
  scanKey,
}: {
  cursor?: number;
  existingKeys: Key[];
  scanKey: Key;
}): EitherAsync<unknown, { cursor?: number; keys: Key[] }> => {
  return EitherAsync(async ({ fromPromise }) => {
    const user = await fromPromise(getUserAsEither());

    return fromPromise(
      getItemsKeysBatch({ user, cursor, scanKey }).map(async (response) => {
        const nextCursor = response.fst();
        const keys = response.snd();

        const done = nextCursor === 0;
        const allKeysThusFar = [...existingKeys, ...keys];

        if (done) {
          return { keys: allKeysThusFar };
        }

        /**
         * We still have more to iterate through, recursively call until no more left
         */
        return fromPromise(
          getAllItemsKeys({
            cursor: response.fst(),
            existingKeys: allKeysThusFar,
            scanKey,
          }).run(),
        );
      }),
    );
  });
};
