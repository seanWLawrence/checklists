import "server-only";

import { S3VectorsClient } from "@aws-sdk/client-s3vectors";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getClientConfiguration } from "@/lib/aws/get-client-configuration";

export const getS3VectorsClient = (): EitherAsync<unknown, S3VectorsClient> => {
  return EitherAsync(async ({ fromPromise }) => {
    return new S3VectorsClient(await fromPromise(getClientConfiguration({})));
  });
};
