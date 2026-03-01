import "@nobush/server-only";

import { S3VectorsClient } from "@aws-sdk/client-s3vectors";

import { awsClientConfiguration } from "@/lib/aws/aws-client-configuration";

export const s3VectorsClient = new S3VectorsClient(awsClientConfiguration);
