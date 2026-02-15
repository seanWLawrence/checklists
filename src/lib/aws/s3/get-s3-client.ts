import "server-only";

import { S3Client } from "@aws-sdk/client-s3";
import { EitherAsync } from "purify-ts/EitherAsync";
import { getClientConfiguration } from "../get-client-configuration";
import { AWS_ENDPOINT } from "@/lib/secrets";

export const getS3Client = (): EitherAsync<unknown, S3Client> => {
  return EitherAsync(async ({ fromPromise }) => {
    return new S3Client(
      await fromPromise(getClientConfiguration({ endpoint: AWS_ENDPOINT })),
    );
  });
};
