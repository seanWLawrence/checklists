import { EitherAsync } from "purify-ts/EitherAsync";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Codec } from "purify-ts/Codec";

export const getItem = <T extends object>({
  pk,
  sk,
  decoder,
  client,
  tableName,
}: {
  pk: string;
  sk: string;
  decoder: Codec<T>;
  client?: DynamoDBDocumentClient;
  tableName?: string;
}): EitherAsync<unknown, T | null> => {
  return EitherAsync(async ({ liftEither }) => {
    const resolvedClient =
      client ?? (await import("./dynamodb-client")).dynamoDbClient;
    const resolvedTableName =
      tableName ?? (await import("@/lib/env.server")).AWS_TABLE_NAME;

    const response = await resolvedClient.send(
      new GetCommand({
        TableName: resolvedTableName,
        Key: {
          pk,
          sk,
        },
      }),
    );

    if (!response.Item) {
      return null;
    }

    return liftEither(decoder.decode(response.Item));
  });
};
