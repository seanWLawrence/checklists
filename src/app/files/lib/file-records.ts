import "@nobush/server-only";

import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { EitherAsync } from "purify-ts/EitherAsync";
import { FileRecord } from "../file.types";
import { array } from "purify-ts/Codec";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getItem } from "@/lib/aws/dynamodb/get-item";
import { dynamoDbClient } from "@/lib/aws/dynamodb/dynamodb-client";
import { AWS_TABLE_NAME } from "@/lib/env.server";
import { getFilePartitionKey, getFileSortKey } from "./file-record-keys";

export { getFilePartitionKey, getFileSortKey } from "./file-record-keys";

export const getFileForCurrentUser = (id: string): EitherAsync<unknown, FileRecord | null> =>
  EitherAsync<unknown, FileRecord | null>(async ({ fromPromise }) => {
    const user = await fromPromise(validateUserLoggedIn({}));
    return fromPromise(getItem({ pk: getFilePartitionKey(user.username), sk: getFileSortKey(id), decoder: FileRecord }));
  });

export const getFilesForCurrentUser = (): EitherAsync<unknown, FileRecord[]> =>
  EitherAsync<unknown, FileRecord[]>(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(validateUserLoggedIn({}));
    const response = await dynamoDbClient.send(new QueryCommand({
      TableName: AWS_TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": getFilePartitionKey(user.username) },
      ScanIndexForward: false,
    }));
    return liftEither(array(FileRecord).decode(response.Items ?? []));
  }).map((files) => files.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso)));
