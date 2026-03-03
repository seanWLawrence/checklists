import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { workerEnv } from "./env";

const workerAwsClientConfiguration = {
  region: workerEnv.AWS_REGION,
};

const workerDynamoDbRawClient = new DynamoDBClient(workerAwsClientConfiguration);

export const workerDynamoDbClient = DynamoDBDocumentClient.from(
  workerDynamoDbRawClient,
  {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  },
);

export const workerS3Client = new S3Client(workerAwsClientConfiguration);

export const workerSecretsManagerClient = new SecretsManagerClient(
  workerAwsClientConfiguration,
);
