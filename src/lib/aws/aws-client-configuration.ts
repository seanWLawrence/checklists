import "@nobush/server-only";

import { fromTemporaryCredentials } from "@aws-sdk/credential-providers";
import { S3ClientConfig } from "@aws-sdk/client-s3";

import {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_ROLE_ARN,
  AWS_ROLE_DURATION_SECONDS,
  AWS_ROLE_SESSION_NAME,
  AWS_SECRET_ACCESS_KEY,
} from "@/lib/env.server";

const awsCredentials = fromTemporaryCredentials({
  params: {
    RoleArn: AWS_ROLE_ARN,
    RoleSessionName: AWS_ROLE_SESSION_NAME,
    DurationSeconds: AWS_ROLE_DURATION_SECONDS,
  },
  clientConfig: { region: AWS_REGION },
  masterCredentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export const awsClientConfiguration: Pick<
  S3ClientConfig,
  "region" | "credentials"
> = {
  credentials: awsCredentials,
  region: AWS_REGION,
};
