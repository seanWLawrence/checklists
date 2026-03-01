import "@nobush/server-only";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { awsClientConfiguration } from "../aws-client-configuration";

const dynamoDbRawClient = new DynamoDBClient(awsClientConfiguration);

export const dynamoDbClient = DynamoDBDocumentClient.from(dynamoDbRawClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
