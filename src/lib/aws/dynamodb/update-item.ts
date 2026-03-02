import { EitherAsync } from "purify-ts/EitherAsync";
import { dynamoDbClient } from "./dynamodb-client";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { AWS_TABLE_NAME } from "@/lib/env.server";
import { logger } from "@/lib/logger";
import { AttributeNames, AttributeValues } from "./dynamodb.types";

export const updateItem = ({
  pk,
  sk,
  updateExpression,
  conditionExpression,
  attributeNames,
  attributeValues,
}: {
  pk: string;
  sk: string;
  updateExpression: string;
  conditionExpression?: string;
  attributeNames: AttributeNames;
  attributeValues: AttributeValues;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      await dynamoDbClient.send(
        new UpdateCommand({
          TableName: AWS_TABLE_NAME,
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
