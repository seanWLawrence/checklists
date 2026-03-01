import "@nobush/server-only";

import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

import { awsClientConfiguration } from "../aws-client-configuration";

export const secretsManagerClient = new SecretsManagerClient(
  awsClientConfiguration,
);
