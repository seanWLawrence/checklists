import { EitherAsync } from "purify-ts/EitherAsync";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { logger } from "@/lib/logger";
import { AttributeNames, AttributeValues } from "./dynamodb.types";

export const updateItem = ({
  pk,
  sk,
  updateExpression,
  conditionExpression,
  attributeNames,
  attributeValues,
  client,
  tableName,
}: {
  pk: string;
  sk: string;
  updateExpression: string;
  conditionExpression?: string;
  attributeNames: AttributeNames;
  attributeValues: AttributeValues;
  client?: DynamoDBDocumentClient;
  tableName?: string;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      const resolvedClient =
        client ?? (await import("./dynamodb-client")).dynamoDbClient;
      const resolvedTableName =
        tableName ?? (await import("@/lib/env.server")).AWS_TABLE_NAME;

      await resolvedClient.send(
        new UpdateCommand({
          TableName: resolvedTableName,
          Key: {
            pk,
            sk,
          },
          UpdateExpression: updateExpression,
          ConditionExpression: conditionExpression,
          ExpressionAttributeNames: attributeNames,
          ExpressionAttributeValues: attributeValues,
        }),
      );
    } catch (error) {
      logger.error("Failed to update job status", error);

      throwE(error);
    }
  });
};
