import "@nobush/server-only";

import { S3Client } from "@aws-sdk/client-s3";
import { awsClientConfiguration } from "../aws-client-configuration";

export const s3Client = new S3Client(awsClientConfiguration);
