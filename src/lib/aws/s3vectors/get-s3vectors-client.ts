import "server-only";

import { S3VectorsClient } from "@aws-sdk/client-s3vectors";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getClientConfiguration } from "@/lib/aws/get-client-configuration";

export const getS3VectorsClient = (): EitherAsync<unknown, S3VectorsClient> => {
  return EitherAsync(async ({ fromPromise }) => {
    const config = await fromPromise(getClientConfiguration({}));

    return new S3VectorsClient({
      region: config.region,
      credentials: config.credentials,
    });
  });
};
