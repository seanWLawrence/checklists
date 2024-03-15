"use server";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Either } from "purify-ts/Either";
import kv from "@vercel/kv";
import { revalidatePath } from "next/cache";

import {
  Creator,
  IChecklistItem,
  IChecklistMetadata,
  IChecklistSection,
  IKey,
  IMetadata,
  IUser,
} from "@/lib/types";
import { RedirectType, redirect } from "next/navigation";
import { getUser } from "@/lib/auth.model";
import { UUID, randomUUID } from "crypto";

const isOk = (response: "OK" | string): boolean => response === "OK";

const validateUserFromKey = ({
  user,
  key,
}: {
  user: IUser;
  key: IKey;
}): Either<Error, IUser> => {
  return Either.encase(() => {
    const usernameFromKey = key.match(/(?<=user#).*(?=#)/);

    if (usernameFromKey && user.username === usernameFromKey[0]) {
      return user;
    }

    throw new Error("Forbidden");
  });
};

const validateLoggedIn = (): Either<Error, { username: string }> => {
  return Either.encase(() => {
    const user = getUser();

    if (!user) {
      throw new Error("Not logged in");
    }

    return user;
  });
};

const metadata = (user: IUser): IMetadata => {
  return {
    id: randomUUID(),
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
    user,
  };
};

const getAllChecklistsMetadatasScanKey = ({ user }: { user: IUser }): IKey =>
  `user#${user.username}#checklist#*#checklistMetadata`;

const getAllChecklistSectionsScanKey = ({
  user,
  id,
}: {
  user: IUser;
  id: UUID;
}): IKey => `user#${user.username}#checklist#${id}#checklistSection#*`;

const getAllChecklistItemsScanKey = ({
  user,
  checklistId,
  checklistSectionId,
}: {
  user: IUser;
  checklistId: UUID;
  checklistSectionId: UUID;
}): IKey =>
  `user#${user.username}#checklist#${checklistId}#checklistSection#${checklistSectionId}#checklistItem#*`;

/**
 * For deleting an entire checklist
 */
const getAllChecklistKeys = ({ user, id }: { user: IUser; id: UUID }): IKey =>
  `user#${user.username}#checklist#${id}#*`;

const getChecklistMetadataKey = ({
  user,
  id,
}: {
  user: IUser;
  id: UUID;
}): IKey => `user#${user.username}#checklist#${id}#checklistMetadata`;

const getChecklistSectionKey = ({
  user,
  id,
  checklistId,
}: {
  user: IUser;
  id: UUID;
  checklistId: UUID;
}): IKey =>
  `user#${user.username}#checklist#${checklistId}#checklistSection#${id}`;

const getChecklistItemKey = ({
  user,
  id,
  checklistId,
  checklistSectionId,
}: {
  user: IUser;
  id: UUID;
  checklistId: UUID;
  checklistSectionId: UUID;
}): IKey =>
  `user#${user.username}#checklist#${checklistId}#checklistSection#${checklistSectionId}#checklistItem#${id}`;

/**
 * Creates an item in tthe key value store with generic metadata attached automatically
 */
const create = <T extends Creator<object>>({
  key,
  item,
}: {
  key: (itemToCreate: T & IMetadata) => IKey;
  item: T;
}): EitherAsync<Error, T & IMetadata> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const user = await liftEither(validateLoggedIn());

    const itemToCreate: T & IMetadata = { ...metadata(user), ...item };

    const response = await kv.hmset(key(itemToCreate), item);

    if (!isOk(response)) {
      throwE(new Error(`Failed to create ${key}`));
    }

    return itemToCreate;
  });
};

export const createChecklistMetadata = (
  checklistMetadata: Creator<IChecklistMetadata>,
): EitherAsync<Error, IChecklistMetadata> => {
  return create({
    key: getChecklistMetadataKey,
    item: checklistMetadata,
  });
};

export const createChecklistSection = (
  checklistSection: Creator<IChecklistSection>,
): EitherAsync<Error, IChecklistSection> => {
  return create({
    key: getChecklistSectionKey,
    item: checklistSection,
  });
};

export const createChecklistItem = (
  checklistItem: Creator<IChecklistItem>,
): EitherAsync<Error, IChecklistItem> => {
  return create({
    key: (item) =>
      `user#${item.user.username}#checklist#${item.id}#checklistSection#${item.checklistSectionId}#checklistItem#${item.id}`,
    item: checklistItem,
  });
};

const update = <T extends IMetadata & object>({
  key: keyFn,
  item,
}: {
  key: (item: T & IMetadata) => IKey;
  item: T;
}): EitherAsync<Error, T> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const user = await liftEither(validateLoggedIn());

    const itemToUpdate: T & IMetadata = {
      ...item,
      user,
      updatedAtIso: new Date().toISOString(),
    };

    const key = keyFn(itemToUpdate);

    await liftEither(validateUserFromKey({ key, user }));

    const response = await kv.hmset(
      key,
      itemToUpdate as { [field: string]: unknown },
    );

    if (!isOk(response)) {
      throwE(new Error(`Failed to update ${key}`));
    }

    return item;
  });
};

export const updateChecklistMetadata = (
  checklistMetadata: IChecklistMetadata,
): EitherAsync<Error, IChecklistMetadata> => {
  return update({
    key: getChecklistMetadataKey,
    item: checklistMetadata,
  });
};

export const updateChecklistSection = (
  checklistSection: IChecklistSection,
): EitherAsync<Error, IChecklistSection> => {
  return create({
    key: getChecklistSectionKey,
    item: checklistSection,
  });
};

export const updateChecklistItem = (
  checklistItem: IChecklistItem,
): EitherAsync<Error, IChecklistItem> => {
  return create({
    key: getChecklistItemKey,
    item: checklistItem,
  });
};

const deleteAll = (keys: IKey[]): EitherAsync<Error, void> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const user = await liftEither(validateLoggedIn());

    await Promise.all(
      keys.map((key) => {
        return liftEither(validateUserFromKey({ user, key }));
      }),
    );

    const response = await kv.del(...keys);

    if (response === 0) {
      throwE(new Error(`Failed to delete one or more ${keys.join(", ")}`));
    }
  });
};

const getAllObjectsFromKeys = <T extends object>(
  keys: IKey[],
): EitherAsync<Error, T[]> => {
  return EitherAsync(async ({ liftEither }) => {
    const user = await liftEither(validateLoggedIn());

    const values = await Promise.all(
      keys.map(async (key) => {
        await liftEither(validateUserFromKey({ user, key }));

        return kv.get(key) as T | null;
      }),
    );

    return values.filter(Boolean) as T[];
  });
};

const getAllChecklistsMetadatasKeys = ({
  cursor,
  existingKeys,
}: {
  cursor?: number;
  existingKeys: IKey[];
}): EitherAsync<Error, { cursor: number; keys: IKey[] }> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await liftEither(validateLoggedIn());

    const response = await kv.scan(cursor ?? 0, {
      type: "hash",
      match: getAllChecklistsMetadatasScanKey({ user }),
    });

    const responseCursor = response[0];
    const responseKeys = response[1] as IKey[];

    if (!responseCursor) {
      return {
        cursor: responseCursor,
        keys: [...existingKeys, ...responseKeys],
      };
    }

    /**
     * We still have more to iterate through, recursively call until no more left
     */
    return fromPromise(
      getAllChecklistsMetadatasKeys({
        cursor: responseCursor,
        existingKeys: [...existingKeys, ...responseKeys],
      }),
    );
  });
};

export const getAllChecklistsMetadatas = (): EitherAsync<
  Error,
  IChecklistMetadata[]
> => {
  return EitherAsync(async ({ fromPromise }) => {
    const { keys: validatedKeys } = await fromPromise(
      getAllChecklistsMetadatasKeys({ existingKeys: [] }),
    );

    return await fromPromise(getAllObjectsFromKeys(validatedKeys));
  });
};

const getAllChecklistSectionsKeys = ({
  cursor,
  existingKeys,
  id,
}: {
  cursor?: number;
  existingKeys: IKey[];
  id: UUID;
}): EitherAsync<Error, { cursor: number; keys: IKey[] }> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await liftEither(validateLoggedIn());

    const response = await kv.scan(cursor ?? 0, {
      type: "hash",
      match: getAllChecklistSectionsScanKey({ user, id }),
    });

    const responseCursor = response[0];
    const responseKeys = response[1] as IKey[];

    if (!responseCursor) {
      return {
        cursor: responseCursor,
        keys: [...existingKeys, ...responseKeys],
      };
    }

    /**
     * We still have more to iterate through, recursively call until no more left
     */
    return fromPromise(
      getAllChecklistSectionsKeys({
        cursor: responseCursor,
        existingKeys: [...existingKeys, ...responseKeys],
        id,
      }),
    );
  });
};

export const getAllChecklistSections = ({
  id,
}: {
  id: UUID;
}): EitherAsync<Error, IChecklistSection[]> => {
  return EitherAsync(async ({ fromPromise }) => {
    const { keys: validatedKeys } = await fromPromise(
      getAllChecklistSectionsKeys({ existingKeys: [], id }),
    );

    return await fromPromise(getAllObjectsFromKeys(validatedKeys));
  });
};

const getAllChecklistItemsKeys = ({
  cursor,
  existingKeys,
  checklistSectionId,
  checklistId,
}: {
  cursor?: number;
  existingKeys: IKey[];
  checklistId: UUID;
  checklistSectionId: UUID;
}): EitherAsync<Error, { cursor: number; keys: IKey[] }> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await liftEither(validateLoggedIn());

    const response = await kv.scan(cursor ?? 0, {
      type: "hash",
      match: getAllChecklistItemsScanKey({
        user,
        checklistId,
        checklistSectionId,
      }),
    });

    const responseCursor = response[0];
    const responseKeys = response[1] as IKey[];

    if (!responseCursor) {
      return {
        cursor: responseCursor,
        keys: [...existingKeys, ...responseKeys],
      };
    }

    /**
     * We still have more to iterate through, recursively call until no more left
     */
    return fromPromise(
      getAllChecklistItemsKeys({
        cursor: responseCursor,
        existingKeys: [...existingKeys, ...responseKeys],
        checklistSectionId,
        checklistId,
      }),
    );
  });
};

export const deleteChecklist = (
  checklistMetadata: IChecklistMetadata,
): EitherAsync<Error, void> => {
  return deleteAll([
    getAllChecklistKeys({
      id: checklistMetadata.id,
      user: checklistMetadata.user,
    }),
  ]);
};

export const deleteChecklistSection = (
  checklistSection: IChecklistSection,
): EitherAsync<Error, void> => {
  return deleteAll([getChecklistSectionKey(checklistSection)]);
};

export const deleteChecklistItem = (
  checklistItem: IChecklistItem,
): EitherAsync<Error, void> => {
  return deleteAll([getChecklistItemKey(checklistItem)]);
};
