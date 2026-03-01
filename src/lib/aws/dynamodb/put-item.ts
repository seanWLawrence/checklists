import { EitherAsync } from "purify-ts/EitherAsync";
import { dynamoDbClient } from "./dynamodb-client";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { AWS_TABLE_NAME } from "@/lib/env.server";
import { logger } from "@/lib/logger";

export const putItem = ({
  item,
  conditionExpression,
}: {
  item: { pk: string; sk: string } & Record<string, unknown>;
  conditionExpression?: string;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ throwE }) => {
    const response = await dynamoDbClient.send(
      new PutCommand({
        TableName: AWS_TABLE_NAME,
        Item: item,
        ConditionExpression: conditionExpression,
      }),
    );

    if (response.$metadata.httpStatusCode !== 200) {
      logger.error(response);
      return throwE(`Failed to put item with pk ${item.pk} and sk ${item.sk}`);
    }
  });
};
