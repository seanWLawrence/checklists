import "@nobush/server-only";

import { SQSClient } from "@aws-sdk/client-sqs";

import { awsClientConfiguration } from "../aws-client-configuration";

export const sqsClient = new SQSClient(awsClientConfiguration);
