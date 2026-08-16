"use server";

import { revalidatePath } from "next/cache";
import { EitherAsync } from "purify-ts/EitherAsync";
import { updateItem } from "@/lib/aws/dynamodb/update-item";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { getFileForCurrentUser, getFilePartitionKey, getFileSortKey } from "../lib/file-records";
import { FILE_CATEGORIES, FileCategory } from "../file.types";
import { getOrganizedFileKey } from "../lib/file-keys";
import { moveObject } from "@/lib/aws/s3/move-object";

const splitValues = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30);

export const updateFileClassificationAction = async (formData: FormData): Promise<void> => {
  const response = await EitherAsync<unknown, { id: string }>(async ({ fromPromise, liftEither, throwE }) => {
    const user = await fromPromise(validateUserLoggedIn({ variant: "server-action" }));
    const id = await liftEither(getStringFromFormData({ name: "id", formData }));
    const categoryValue = await liftEither(getStringFromFormData({ name: "topLevelCategory", formData }));
    const kind = await liftEither(getStringFromFormData({ name: "kind", formData }));
    const title = await liftEither(getStringFromFormData({ name: "title", formData }));
    const primaryDate = await liftEither(getStringFromFormData({ name: "primaryDate", formData }));
    const entities = await liftEither(getStringFromFormData({ name: "entities", formData }));
    const tags = await liftEither(getStringFromFormData({ name: "tags", formData }));
    if (!FILE_CATEGORIES.includes(categoryValue as FileCategory)) return throwE("Choose a valid category");
    if (!kind.trim() || !title.trim()) return throwE("Kind and title are required");
    if (primaryDate && !/^\d{4}(-\d{2}-\d{2})?$/.test(primaryDate)) return throwE("Date must be a year or YYYY-MM-DD");
    const file = await fromPromise(getFileForCurrentUser(id));
    if (!file) return throwE("File not found");
    const nextKey = getOrganizedFileKey({ ownerId: user.username, fileId: file.id, category: categoryValue as FileCategory, kind, primaryDate: primaryDate || undefined, entity: splitValues(entities)[0], originalFilename: file.originalFilename });
    if (file.s3Key !== nextKey) await fromPromise(moveObject({ sourceKey: file.s3Key, destinationKey: nextKey }));
    const now = new Date().toISOString();
    await fromPromise(updateItem({
      pk: getFilePartitionKey(user.username), sk: getFileSortKey(file.id),
      updateExpression: "SET #s3Key = :s3Key, #status = :status, #category = :category, #kind = :kind, #title = :title, #primaryDate = :primaryDate, #entities = :entities, #tags = :tags, #updatedAtIso = :updatedAtIso",
      attributeNames: { "#s3Key": "s3Key", "#status": "status", "#category": "topLevelCategory", "#kind": "kind", "#title": "title", "#primaryDate": "primaryDate", "#entities": "entities", "#tags": "tags", "#updatedAtIso": "updatedAtIso" },
      attributeValues: { ":s3Key": nextKey, ":status": "ready", ":category": categoryValue, ":kind": kind.trim(), ":title": title.trim(), ":primaryDate": primaryDate || "", ":entities": splitValues(entities), ":tags": splitValues(tags), ":updatedAtIso": now },
    }));
    return { id: file.id };
  }).run();
  if (response.isLeft()) throw new Error(String(response.extract()));
  revalidatePath("/files");
  revalidatePath(`/files/${(response.extract() as { id: string }).id}`);
};
